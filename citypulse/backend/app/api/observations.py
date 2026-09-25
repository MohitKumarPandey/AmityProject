from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

from ..db.database import get_db
from ..models.observation import ObservationORM

router = APIRouter()

class CreateObservationSchema(BaseModel):
    city: str
    data_type: str = "weather"
    source: str = "User Reported"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: Optional[str] = "NORMAL"
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    aqi: Optional[float] = None
    notes: Optional[str] = None

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
    stmt = stmt.where(ObservationORM.is_simulated == False)
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

@router.get("/cities")
async def list_cities(db: AsyncSession = Depends(get_db)):
    """Return distinct non‑simulated city names sorted alphabetically."""
    stmt = select(ObservationORM.city).where(
        ObservationORM.is_simulated == False,
        ObservationORM.city.isnot(None)
    ).distinct()
    result = await db.execute(stmt)
    cities = [row[0] for row in result.fetchall() if row[0]]
    return sorted(cities)

@router.post("/")
async def create_observation(
    payload: CreateObservationSchema,
    db: AsyncSession = Depends(get_db)
):
    """Create and persist a real observation in the database."""
    new_obs = ObservationORM(
        city=payload.city,
        data_type=payload.data_type,
        source=payload.source,
        latitude=payload.latitude,
        longitude=payload.longitude,
        severity=payload.severity,
        temperature_c=payload.temperature_c,
        humidity_percent=payload.humidity_percent,
        aqi=payload.aqi,
        timestamp=datetime.utcnow(),
        is_simulated=False
    )
    db.add(new_obs)
    await db.commit()
    await db.refresh(new_obs)
    return {
        "id": new_obs.id,
        "city": new_obs.city,
        "data_type": new_obs.data_type,
        "timestamp": new_obs.timestamp.isoformat(),
        "status": "created"
    }

@router.delete("/{obs_id}")
async def delete_observation(
    obs_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete an observation from the database."""
    stmt = select(ObservationORM).where(ObservationORM.id == obs_id)
    result = await db.execute(stmt)
    obs = result.scalars().first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
    
    await db.delete(obs)
    await db.commit()
    return {"id": obs_id, "status": "deleted"}
