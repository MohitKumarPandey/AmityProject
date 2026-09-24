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
    cutoff = datetime.utcnow() - timedelta(hours=2)

    # Count records per source in last 2 hours
    result = await db.execute(
        select(ObservationORM.source, ObservationORM.data_type, ObservationORM.is_simulated,
               func.count(ObservationORM.id).label("count"),
               func.max(ObservationORM.timestamp).label("last_updated"))
        .where(ObservationORM.timestamp >= cutoff)
        .group_by(ObservationORM.source, ObservationORM.data_type, ObservationORM.is_simulated)
    )
    rows = result.all()

    # Build provider dict
    providers_map = {}
    for row in rows:
        key = row.source
        providers_map[key] = {
            "name": row.source,
            "data_type": row.data_type,
            "status": "LIVE",
            "last_updated": row.last_updated.isoformat() if row.last_updated else None,
            "record_count": row.count,
            "is_simulated": bool(row.is_simulated),
        }

    # Always show known providers with status
    defaults = [
        {"name": "open-meteo", "data_type": "weather", "is_simulated": False},
        {"name": "openaq", "data_type": "air_quality", "is_simulated": False},
        {"name": "Simulated Transit", "data_type": "transit", "is_simulated": True},
        {"name": "Simulated Disaster Provider", "data_type": "disaster", "is_simulated": True},
    ]
    for d in defaults:
        if d["name"] not in providers_map:
            providers_map[d["name"]] = {
                "name": d["name"],
                "data_type": d["data_type"],
                "status": "NO_DATA",
                "last_updated": None,
                "record_count": 0,
                "is_simulated": d["is_simulated"],
            }

    return list(providers_map.values())
