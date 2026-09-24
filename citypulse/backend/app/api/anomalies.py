from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from ..db.database import get_db
from ..models.anomaly import AnomalyORM, AnomalySchema

router = APIRouter()

@router.get("/", response_model=List[AnomalySchema])
async def list_anomalies(limit: int = 50, city: str = None, db: AsyncSession = Depends(get_db)):
    query = select(AnomalyORM).order_by(desc(AnomalyORM.detected_at)).limit(limit)
    if city:
        query = query.where(AnomalyORM.city == city)
    result = await db.execute(query)
    return result.scalars().all()
