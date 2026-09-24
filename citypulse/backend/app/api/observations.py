from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_db
from ..models.observation import ObservationORM

router = APIRouter()


@router.get("/")
async def list_observations(
    limit: int = Query(100, gt=0, le=1000),
    city: str | None = Query(None),
    data_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ObservationORM).order_by(ObservationORM.timestamp.desc()).limit(limit)
    if city:
        stmt = stmt.where(ObservationORM.city == city)
    if data_type:
        stmt = stmt.where(ObservationORM.data_type == data_type)
    result = await db.execute(stmt)
    observations = result.scalars().all()
    return [
        {
            "id": o.id,
            "source": o.source,
            "data_type": o.data_type,
            "city": o.city,
            "zone": o.zone,
            "latitude": o.latitude,
            "longitude": o.longitude,
            "timestamp": o.timestamp.isoformat() if o.timestamp else None,
            "severity": o.severity,
            "metric": o.metric,
            "value": o.value,
            "unit": o.unit,
            "status": o.status,
            "temperature_c": o.temperature_c,
            "humidity_percent": o.humidity_percent,
            "aqi": o.aqi,
            "is_simulated": o.is_simulated,
        }
        for o in observations
    ]
