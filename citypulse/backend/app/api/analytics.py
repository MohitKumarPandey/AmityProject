"""Analytics API - Civic Pulse, summaries, anomaly detection, correlation triggers."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta
from typing import Optional

from ..db.database import get_db
from ..models.observation import ObservationORM
from ..models.anomaly import AnomalyORM, CorrelationORM
from ..models.event import CivicEventORM, AlertORM
from ..services.anomaly import detect_anomalies_for_city
from ..services.correlation import compute_correlations_for_city

router = APIRouter()


@router.get("/summary")
async def get_summary(city: str = None, db: AsyncSession = Depends(get_db)):
    """Grounded summary from actual stored data."""
    cutoff = datetime.utcnow() - timedelta(hours=24)
    query = select(ObservationORM).where(ObservationORM.timestamp >= cutoff)
    if city:
        query = query.where(ObservationORM.city == city)
    result = await db.execute(query)
    observations = result.scalars().all()

    if not observations:
        return {
            "status": "insufficient_data",
            "summary": "No observations available for the selected period. Unable to generate summary.",
            "observation_count": 0,
        }

    # Compute real statistics
    temps = [o.temperature_c for o in observations if o.temperature_c is not None]
    aqis = [float(o.aqi) for o in observations if o.aqi is not None]
    humidities = [o.humidity_percent for o in observations if o.humidity_percent is not None]
    cities = list(set(o.city for o in observations))

    avg_temp = round(sum(temps) / len(temps), 1) if temps else None
    avg_aqi = round(sum(aqis) / len(aqis), 0) if aqis else None
    avg_humidity = round(sum(humidities) / len(humidities), 1) if humidities else None

    # Build grounded summary
    parts = []
    city_label = city or "monitored cities"
    if avg_aqi is not None:
        if avg_aqi > 100:
            parts.append(f"Air quality is elevated in {city_label} with an average AQI of {int(avg_aqi)}.")
        elif avg_aqi > 50:
            parts.append(f"Air quality is moderate in {city_label} with an average AQI of {int(avg_aqi)}.")
        else:
            parts.append(f"Air quality is good in {city_label} with an average AQI of {int(avg_aqi)}.")

    if avg_temp is not None:
        parts.append(f"Average temperature is {avg_temp} degrees C.")

    if avg_humidity is not None:
        parts.append(f"Relative humidity averages {avg_humidity}%.")

    if not parts:
        parts.append("Observations are being collected but no summarizable metrics are available yet.")

    # Check active events
    event_result = await db.execute(
        select(func.count(CivicEventORM.id)).where(CivicEventORM.status == "ACTIVE")
    )
    active_events = event_result.scalar() or 0
    if active_events > 0:
        parts.append(f"There are {active_events} active civic event(s) being monitored.")

    return {
        "status": "ok",
        "summary": " ".join(parts),
        "observation_count": len(observations),
        "cities": cities,
        "avg_temperature_c": avg_temp,
        "avg_aqi": avg_aqi,
        "avg_humidity_percent": avg_humidity,
        "active_events": active_events,
        "period_hours": 24,
    }


@router.get("/civic-pulse")
async def get_civic_pulse(city: str = None, db: AsyncSession = Depends(get_db)):
    """Transparent Civic Pulse calculated from real observations and events."""
    cutoff = datetime.utcnow() - timedelta(hours=24)

    # Observation counts
    obs_query = select(func.count(ObservationORM.id)).where(ObservationORM.timestamp >= cutoff)
    if city:
        obs_query = obs_query.where(ObservationORM.city == city)
    obs_count = (await db.execute(obs_query)).scalar() or 0

    # Anomaly counts
    anom_query = select(func.count(AnomalyORM.id)).where(AnomalyORM.detected_at >= cutoff)
    if city:
        anom_query = anom_query.where(AnomalyORM.city == city)
    anomaly_count = (await db.execute(anom_query)).scalar() or 0

    # Active events
    event_query = select(func.count(CivicEventORM.id)).where(CivicEventORM.status == "ACTIVE")
    if city:
        event_query = event_query.where(CivicEventORM.city == city)
    event_count = (await db.execute(event_query)).scalar() or 0

    # Unread alerts
    alert_query = select(func.count(AlertORM.id)).where(AlertORM.is_read == False)
    unread_alerts = (await db.execute(alert_query)).scalar() or 0

    # Average metrics
    obs_result = await db.execute(
        select(
            func.avg(ObservationORM.temperature_c),
            func.avg(ObservationORM.aqi),
            func.avg(ObservationORM.humidity_percent),
        ).where(ObservationORM.timestamp >= cutoff)
    )
    row = obs_result.one_or_none()
    avg_temp = round(row[0], 1) if row and row[0] else None
    avg_aqi = int(row[1]) if row and row[1] else None
    avg_humidity = round(row[2], 1) if row and row[2] else None

    # Compute transparent pulse dimensions
    def dimension_score(value, good_threshold, bad_threshold):
        """Returns score 0-100 and status. Higher = healthier."""
        if value is None:
            return None, "Insufficient data"
        if value <= good_threshold:
            return min(100, int(100 - (value / bad_threshold) * 100)), "Good"
        elif value <= bad_threshold:
            return int(100 - (value / bad_threshold) * 100), "Moderate"
        else:
            return max(0, int(100 - (value / bad_threshold) * 100)), "Poor"

    air_score, air_status = dimension_score(avg_aqi, 50, 200) if avg_aqi else (None, "Insufficient data")
    weather_status = "Normal" if avg_temp and 10 <= avg_temp <= 40 else ("Extreme" if avg_temp else "Insufficient data")

    pulse = {
        "status": "ok" if obs_count > 0 else "insufficient_data",
        "city": city or "All",
        "period_hours": 24,
        "observation_count": obs_count,
        "dimensions": {
            "air_quality": {
                "avg_aqi": avg_aqi,
                "score": air_score,
                "status": air_status,
                "explanation": f"Based on {obs_count} observations in the last 24 hours." if avg_aqi else "No AQI data available.",
            },
            "weather": {
                "avg_temperature_c": avg_temp,
                "avg_humidity_percent": avg_humidity,
                "status": weather_status,
                "explanation": f"Temperature {avg_temp} C, humidity {avg_humidity}%." if avg_temp else "No weather data available.",
            },
            "emergency": {
                "active_events": event_count,
                "status": "Alert" if event_count > 0 else "Clear",
                "explanation": f"{event_count} active event(s)." if event_count > 0 else "No active emergency events.",
            },
            "infrastructure": {
                "anomaly_count": anomaly_count,
                "status": "Anomalies detected" if anomaly_count > 0 else "Normal",
                "explanation": f"{anomaly_count} anomaly/anomalies detected in the last 24 hours.",
            },
        },
        "alerts_unread": unread_alerts,
    }
    return pulse


@router.post("/detect-anomalies")
async def trigger_anomaly_detection(
    city: str = Query(...),
    hours_back: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
):
    """Trigger anomaly detection for a city. Returns detected anomalies or insufficient data message."""
    results = await detect_anomalies_for_city(db, city, hours_back)
    return {"city": city, "hours_back": hours_back, "results": results}


@router.post("/compute-correlations")
async def trigger_correlation(
    city: str = Query(...),
    hours_back: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
):
    """Compute correlations between civic signals for a city."""
    results = await compute_correlations_for_city(db, city, hours_back)
    return {"city": city, "hours_back": hours_back, "results": results}


@router.get("/trends")
async def get_trends(
    city: str = Query(None),
    hours_back: int = Query(48, ge=1, le=720),
    db: AsyncSession = Depends(get_db),
):
    """Return observation time series data for charting."""
    cutoff = datetime.utcnow() - timedelta(hours=hours_back)
    query = (
        select(ObservationORM)
        .where(ObservationORM.timestamp >= cutoff)
        .order_by(ObservationORM.timestamp.asc())
    )
    if city:
        query = query.where(ObservationORM.city == city)

    result = await db.execute(query)
    observations = result.scalars().all()

    return [
        {
            "id": o.id,
            "city": o.city,
            "timestamp": o.timestamp.isoformat(),
            "temperature_c": o.temperature_c,
            "humidity_percent": o.humidity_percent,
            "aqi": o.aqi,
            "source": o.source,
            "is_simulated": o.is_simulated,
        }
        for o in observations
    ]
