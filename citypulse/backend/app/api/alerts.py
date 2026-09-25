from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, or_
from typing import List, Optional

from ..db.database import get_db
from ..models.event import AlertORM, AlertSchema
from ..models.user import UserORM
from .auth import get_optional_current_user

router = APIRouter()

@router.get("/", response_model=List[AlertSchema])
async def list_alerts(
    current_user: Optional[UserORM] = Depends(get_optional_current_user),
    limit: int = 50,
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    if current_user:
        query = select(AlertORM).where(or_(AlertORM.user_id == current_user.id, AlertORM.user_id.is_(None)))
    else:
        query = select(AlertORM)
        
    query = query.order_by(desc(AlertORM.created_at)).limit(limit)
    if unread_only:
        query = query.where(AlertORM.is_read == False)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/unread-count")
async def unread_count(
    current_user: Optional[UserORM] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user:
        stmt = select(func.count(AlertORM.id)).where(
            or_(AlertORM.user_id == current_user.id, AlertORM.user_id.is_(None)),
            AlertORM.is_read == False
        )
    else:
        stmt = select(func.count(AlertORM.id)).where(AlertORM.is_read == False)

    result = await db.execute(stmt)
    count = result.scalar() or 0
    return {"unread_count": count}

@router.post("/{alert_id}/read")
async def mark_read(
    alert_id: int,
    current_user: Optional[UserORM] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AlertORM).where(AlertORM.id == alert_id)
    )
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    await db.commit()
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_read(
    current_user: Optional[UserORM] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user:
        stmt = select(AlertORM).where(
            or_(AlertORM.user_id == current_user.id, AlertORM.user_id.is_(None)),
            AlertORM.is_read == False
        )
    else:
        stmt = select(AlertORM).where(AlertORM.is_read == False)

    result = await db.execute(stmt)
    for alert in result.scalars().all():
        alert.is_read = True
    await db.commit()
    return {"status": "success"}
