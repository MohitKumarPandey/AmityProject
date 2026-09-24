from sqlalchemy.ext.asyncio import AsyncSession
from ..models.event import CivicEventORM, CivicEventSchema, AlertORM, AlertSchema

async def persist_event(db: AsyncSession, event_data: CivicEventSchema) -> CivicEventORM:
    event_orm = CivicEventORM(**event_data.model_dump(exclude_unset=True))
    db.add(event_orm)
    await db.flush()
    await db.refresh(event_orm)
    return event_orm

async def persist_alert(db: AsyncSession, alert_data: AlertSchema) -> AlertORM:
    alert_orm = AlertORM(**alert_data.model_dump(exclude_unset=True))
    db.add(alert_orm)
    await db.flush()
    await db.refresh(alert_orm)
    return alert_orm
