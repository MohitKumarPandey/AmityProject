"""Correlation engine for detecting associations between civic signals.

Uses Pearson correlation where appropriate.
Labels all findings as correlations, NEVER as causation.
"""
import math
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models.observation import ObservationORM
from ..models.anomaly import CorrelationORM

logger = logging.getLogger(__name__)

MIN_SAMPLES_FOR_CORRELATION = 10


def pearson_correlation(x: List[float], y: List[float]) -> Tuple[float, int]:
    """Compute Pearson correlation coefficient for two equal-length lists."""
    n = min(len(x), len(y))
    if n < 2:
        return 0.0, n

    x = x[:n]
    y = y[:n]

    mean_x = sum(x) / n
    mean_y = sum(y) / n

    cov = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    std_x = math.sqrt(sum((xi - mean_x) ** 2 for xi in x))
    std_y = math.sqrt(sum((yi - mean_y) ** 2 for yi in y))

    if std_x == 0 or std_y == 0:
        return 0.0, n

    r = cov / (std_x * std_y)
    return round(r, 4), n


def interpret_correlation(r: float) -> str:
    """Provide a human-readable interpretation of a correlation coefficient.
    Never claims causation."""
    abs_r = abs(r)
    direction = "positive" if r > 0 else "negative"

    if abs_r >= 0.7:
        strength = "strong"
    elif abs_r >= 0.4:
        strength = "moderate"
    elif abs_r >= 0.2:
        strength = "weak"
    else:
        return "No meaningful association detected in this time window."

    return f"A {strength} {direction} correlation was detected. This indicates a possible association, not causation."


async def compute_correlations_for_city(
    db: AsyncSession,
    city: str,
    hours_back: int = 24,
) -> List[Dict[str, Any]]:
    """Compute correlations between available civic signal pairs for a city."""
    cutoff = datetime.utcnow() - timedelta(hours=hours_back)
    result = await db.execute(
        select(ObservationORM)
        .where(ObservationORM.city == city, ObservationORM.timestamp >= cutoff)
        .order_by(ObservationORM.timestamp.asc())
    )
    observations = result.scalars().all()

    if len(observations) < MIN_SAMPLES_FOR_CORRELATION:
        return [{
            "status": "insufficient_data",
            "city": city,
            "message": f"Only {len(observations)} observations found. Need at least {MIN_SAMPLES_FOR_CORRELATION} for correlation analysis.",
        }]

    # Extract paired time-series
    temp_values = [o.temperature_c for o in observations if o.temperature_c is not None]
    aqi_values = [float(o.aqi) for o in observations if o.aqi is not None]
    humidity_values = [o.humidity_percent for o in observations if o.humidity_percent is not None]

    correlations_found: List[Dict[str, Any]] = []

    # Temperature vs AQI
    if len(temp_values) >= MIN_SAMPLES_FOR_CORRELATION and len(aqi_values) >= MIN_SAMPLES_FOR_CORRELATION:
        r, n = pearson_correlation(temp_values, aqi_values)
        interpretation = interpret_correlation(r)
        corr = CorrelationORM(
            city=city,
            feature_a="temperature_c",
            feature_b="aqi",
            time_window=f"{hours_back}h",
            correlation_coefficient=r,
            sample_size=n,
            interpretation=interpretation,
        )
        db.add(corr)
        correlations_found.append({
            "feature_a": "temperature_c",
            "feature_b": "aqi",
            "correlation": r,
            "sample_size": n,
            "interpretation": interpretation,
        })

    # Humidity vs AQI
    if len(humidity_values) >= MIN_SAMPLES_FOR_CORRELATION and len(aqi_values) >= MIN_SAMPLES_FOR_CORRELATION:
        r, n = pearson_correlation(humidity_values, aqi_values)
        interpretation = interpret_correlation(r)
        corr = CorrelationORM(
            city=city,
            feature_a="humidity_percent",
            feature_b="aqi",
            time_window=f"{hours_back}h",
            correlation_coefficient=r,
            sample_size=n,
            interpretation=interpretation,
        )
        db.add(corr)
        correlations_found.append({
            "feature_a": "humidity_percent",
            "feature_b": "aqi",
            "correlation": r,
            "sample_size": n,
            "interpretation": interpretation,
        })

    # Temperature vs Humidity
    if len(temp_values) >= MIN_SAMPLES_FOR_CORRELATION and len(humidity_values) >= MIN_SAMPLES_FOR_CORRELATION:
        r, n = pearson_correlation(temp_values, humidity_values)
        interpretation = interpret_correlation(r)
        corr = CorrelationORM(
            city=city,
            feature_a="temperature_c",
            feature_b="humidity_percent",
            time_window=f"{hours_back}h",
            correlation_coefficient=r,
            sample_size=n,
            interpretation=interpretation,
        )
        db.add(corr)
        correlations_found.append({
            "feature_a": "temperature_c",
            "feature_b": "humidity_percent",
            "correlation": r,
            "sample_size": n,
            "interpretation": interpretation,
        })

    if correlations_found:
        await db.commit()

    return correlations_found if correlations_found else [{
        "status": "insufficient_data",
        "city": city,
        "message": "Not enough paired data points for correlation analysis.",
    }]
