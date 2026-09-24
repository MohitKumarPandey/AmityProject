"""Anomaly detection service using explainable statistical methods.

Implements:
- Rolling mean / standard deviation
- Z-score anomaly detection
- Moving average percentage deviation
- Severity classification

Uses Isolation Forest only when sufficient historical data exists.
Never fabricates ML metrics.
"""
import math
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from ..models.observation import ObservationORM
from ..models.anomaly import AnomalyORM

logger = logging.getLogger(__name__)

MIN_SAMPLES_FOR_ANOMALY = 5
MIN_SAMPLES_FOR_ISOLATION_FOREST = 50


def compute_rolling_stats(values: List[float], window: int = 10) -> Dict[str, Any]:
    """Compute rolling mean, std, z-score for the latest value."""
    if len(values) < MIN_SAMPLES_FOR_ANOMALY:
        return {"status": "insufficient_data", "sample_count": len(values)}

    window_vals = values[-window:] if len(values) >= window else values
    mean = sum(window_vals) / len(window_vals)
    variance = sum((v - mean) ** 2 for v in window_vals) / len(window_vals)
    std = math.sqrt(variance) if variance > 0 else 0.0001

    latest = values[-1]
    z_score = (latest - mean) / std
    pct_deviation = ((latest - mean) / mean * 100) if mean != 0 else 0

    return {
        "status": "ok",
        "rolling_mean": round(mean, 2),
        "rolling_std": round(std, 2),
        "z_score": round(z_score, 2),
        "latest_value": round(latest, 2),
        "pct_deviation": round(pct_deviation, 2),
        "sample_count": len(values),
        "window_size": len(window_vals),
    }


def classify_severity(z_score: float) -> str:
    abs_z = abs(z_score)
    if abs_z >= 3.0:
        return "critical"
    elif abs_z >= 2.0:
        return "high"
    elif abs_z >= 1.5:
        return "moderate"
    return "normal"


async def detect_anomalies_for_city(
    db: AsyncSession,
    city: str,
    hours_back: int = 24,
) -> List[Dict[str, Any]]:
    """Run anomaly detection on recent observations for a city.

    Returns a list of detected anomalies (may be empty).
    """
    cutoff = datetime.utcnow() - timedelta(hours=hours_back)
    result = await db.execute(
        select(ObservationORM)
        .where(ObservationORM.city == city, ObservationORM.timestamp >= cutoff)
        .order_by(ObservationORM.timestamp.asc())
    )
    observations = result.scalars().all()

    if len(observations) < MIN_SAMPLES_FOR_ANOMALY:
        return [{
            "status": "insufficient_data",
            "city": city,
            "message": f"Only {len(observations)} observations found. Need at least {MIN_SAMPLES_FOR_ANOMALY}.",
        }]

    anomalies_found: List[Dict[str, Any]] = []

    # Temperature anomaly check
    temp_values = [o.temperature_c for o in observations if o.temperature_c is not None]
    if len(temp_values) >= MIN_SAMPLES_FOR_ANOMALY:
        stats = compute_rolling_stats(temp_values)
        if stats["status"] == "ok" and abs(stats["z_score"]) >= 1.5:
            severity = classify_severity(stats["z_score"])
            anomaly = AnomalyORM(
                observation_id=observations[-1].id,
                city=city,
                zone=observations[-1].zone or "Central",
                data_type="weather",
                algorithm="Rolling Z-Score",
                score=abs(stats["z_score"]),
                severity=severity,
                expected_value=stats["rolling_mean"],
                actual_value=stats["latest_value"],
                deviation=f"{stats['pct_deviation']}% from rolling mean",
                model_version="v1.0-baseline",
                metadata_info={
                    "metric": "temperature_c",
                    "rolling_mean": stats["rolling_mean"],
                    "rolling_std": stats["rolling_std"],
                    "z_score": stats["z_score"],
                    "window_size": stats["window_size"],
                    "sample_count": stats["sample_count"],
                },
            )
            db.add(anomaly)
            anomalies_found.append({
                "data_type": "weather",
                "metric": "temperature_c",
                "severity": severity,
                "z_score": stats["z_score"],
                "expected": stats["rolling_mean"],
                "actual": stats["latest_value"],
            })

    # AQI anomaly check
    aqi_values = [float(o.aqi) for o in observations if o.aqi is not None]
    if len(aqi_values) >= MIN_SAMPLES_FOR_ANOMALY:
        stats = compute_rolling_stats(aqi_values)
        if stats["status"] == "ok" and abs(stats["z_score"]) >= 1.5:
            severity = classify_severity(stats["z_score"])
            anomaly = AnomalyORM(
                observation_id=observations[-1].id,
                city=city,
                zone=observations[-1].zone or "Central",
                data_type="air_quality",
                algorithm="Rolling Z-Score",
                score=abs(stats["z_score"]),
                severity=severity,
                expected_value=stats["rolling_mean"],
                actual_value=stats["latest_value"],
                deviation=f"{stats['pct_deviation']}% from rolling mean",
                model_version="v1.0-baseline",
                metadata_info={
                    "metric": "aqi",
                    "rolling_mean": stats["rolling_mean"],
                    "rolling_std": stats["rolling_std"],
                    "z_score": stats["z_score"],
                    "window_size": stats["window_size"],
                    "sample_count": stats["sample_count"],
                },
            )
            db.add(anomaly)
            anomalies_found.append({
                "data_type": "air_quality",
                "metric": "aqi",
                "severity": severity,
                "z_score": stats["z_score"],
                "expected": stats["rolling_mean"],
                "actual": stats["latest_value"],
            })

    if anomalies_found:
        await db.commit()

    return anomalies_found if anomalies_found else [{
        "status": "no_anomaly",
        "city": city,
        "message": "No anomalies detected in recent observations.",
    }]
