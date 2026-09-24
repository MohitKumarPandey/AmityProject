from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from ..db.database import get_db
from ..models.anomaly import CorrelationORM, CorrelationSchema

router = APIRouter()

@router.get("/", response_model=List[CorrelationSchema])
async def list_correlations(limit: int = 50, city: str = None, db: AsyncSession = Depends(get_db)):
    query = select(CorrelationORM).order_by(desc(CorrelationORM.detected_at)).limit(limit)
    if city:
        query = query.where(CorrelationORM.city == city)
    result = await db.execute(query)
    return result.scalars().all()
