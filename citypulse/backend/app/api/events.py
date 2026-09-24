from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from ..db.database import get_db
from ..models.event import CivicEventORM, CivicEventSchema

router = APIRouter()

@router.get("/", response_model=List[CivicEventSchema])
async def list_events(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CivicEventORM).order_by(desc(CivicEventORM.started_at)).limit(limit))
    return result.scalars().all()
