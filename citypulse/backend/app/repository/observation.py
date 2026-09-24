from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from ..models.observation import ObservationORM, Observation


async def create_observation(session: AsyncSession, obs: ObservationORM) -> ObservationORM:
    session.add(obs)
    await session.commit()
    await session.refresh(obs)
    return obs


async def persist_observation(session: AsyncSession, obs: Observation) -> ObservationORM:
    orm_obj = ObservationORM(
        source=obs.source,
        data_type=obs.data_type,
        city=obs.city,
        zone=obs.zone or "Central",
        latitude=obs.latitude,
        longitude=obs.longitude,
        timestamp=obs.timestamp,
        severity=obs.severity or "normal",
        metric=obs.metric,
        value=obs.value,
        unit=obs.unit,
        status=obs.status or "active",
        temperature_c=obs.temperature_c,
        humidity_percent=obs.humidity_percent,
        aqi=obs.aqi,
        metadata_info=obs.metadata_info,
        raw=obs.raw,
        is_simulated=obs.is_simulated,
    )
    return await create_observation(session, orm_obj)


async def list_observations(
    session: AsyncSession,
    limit: int = 100,
    city: Optional[str] = None,
    data_type: Optional[str] = None,
) -> List[ObservationORM]:
    stmt = select(ObservationORM).order_by(desc(ObservationORM.timestamp)).limit(limit)
    if city:
        stmt = stmt.where(ObservationORM.city == city)
    if data_type:
        stmt = stmt.where(ObservationORM.data_type == data_type)
    result = await session.execute(stmt)
    return result.scalars().all()
