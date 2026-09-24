from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..db import get_db
from ..models.observation import ObservationORM, Observation
from ..providers.weather import OpenMeteoWeatherProvider
from ..repository.observation import persist_observation

router = APIRouter()

@router.post("/weather", status_code=status.HTTP_201_CREATED)
async def ingest_weather(
    city: str,
    latitude: float,
    longitude: float,
    db: AsyncSession = Depends(get_db),
):
    """Fetch current weather from Open‑Meteo and store as an Observation.
    The endpoint can be called manually or from a scheduler.
    """
    try:
        provider = OpenMeteoWeatherProvider(city, latitude, longitude)
        raw = await provider.fetch()
        obs: Observation = provider.to_observation(raw)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed to fetch or parse weather data: {e}")

    # Persist using repository helper
    persisted = await persist_observation(db, obs)
    return {"id": persisted.id, "message": "Observation stored"}

from ..providers.disaster import SimulatedDisasterProvider
from ..models.event import CivicEventORM
from ..repository.event import persist_event
from ..services.alert import generate_nearby_alerts

@router.post("/disaster", status_code=status.HTTP_201_CREATED)
async def ingest_disaster(
    city: str,
    latitude: float,
    longitude: float,
    force: bool = False,
    db: AsyncSession = Depends(get_db),
):
    try:
        provider = SimulatedDisasterProvider(city, latitude, longitude)
        raw = await provider.fetch()
        
        # Override random failure if forced
        if force and not raw:
            raw = {
                "event_type": "FLOOD",
                "title": "Simulated Flood",
                "description": "A simulated critical flood event.",
                "city": city,
                "zone": "Central",
                "latitude": latitude,
                "longitude": longitude,
                "severity": "CRITICAL",
                "source": "Simulated Disaster Provider",
                "radius_km": 60.0,
            }
            
        event_schema = provider.to_event(raw)
        if not event_schema:
            return {"message": "No event generated"}
            
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    # Save to db
    event_orm = CivicEventORM(**event_schema.dict(exclude={"id"}))
    db.add(event_orm)
    await db.commit()
    await db.refresh(event_orm)
    
    # Trigger alert generation
    await generate_nearby_alerts(db, event_orm)
    
    return {"id": event_orm.id, "message": "Disaster event generated and alerts checked"}
