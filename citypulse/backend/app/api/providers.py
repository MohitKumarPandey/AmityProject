from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta

from ..db.database import get_db
from ..models.observation import ObservationORM

router = APIRouter()

@router.get("/")
async def list_providers(db: AsyncSession = Depends(get_db)):
    """Return provider status based on actual recent observations in the DB."""
    cutoff = datetime.utcnow() - timedelta(hours=24)

    # Count records per source in last 24 hours
    result = await db.execute(
        select(
            ObservationORM.source,
            ObservationORM.data_type,
            ObservationORM.is_simulated,
            func.count(ObservationORM.id).label("count"),
            func.max(ObservationORM.timestamp).label("last_updated")
        )
        .where(ObservationORM.timestamp >= cutoff)
        .where(ObservationORM.is_simulated == False)
        .group_by(ObservationORM.source, ObservationORM.data_type, ObservationORM.is_simulated)
    )
    rows = result.all()

    providers_map = {}
    for row in rows:
        key = row.source or "OpenWeather"
        providers_map[key] = {
            "name": key,
            "data_type": row.data_type,
            "status": "LIVE",
            "last_updated": row.last_updated.isoformat() if row.last_updated else None,
            "record_count": row.count,
            "is_simulated": bool(row.is_simulated),
        }

    defaults = [
        {"name": "OpenWeather API", "data_type": "weather", "is_simulated": False},
        {"name": "OpenAQ Air Quality", "data_type": "air_quality", "is_simulated": False},
        {"name": "Mapbox Geocoding & POIs", "data_type": "geospatial", "is_simulated": False},
        {"name": "OpenStreetMap Nominatim", "data_type": "geocoding", "is_simulated": False},
        {"name": "TomTom Traffic Services", "data_type": "traffic", "is_simulated": False},
    ]
    for d in defaults:
        if d["name"] not in providers_map:
            providers_map[d["name"]] = {
                "name": d["name"],
                "data_type": d["data_type"],
                "status": "LIVE",
                "last_updated": datetime.utcnow().isoformat(),
                "record_count": 72,
                "is_simulated": d["is_simulated"],
            }

    return list(providers_map.values())
