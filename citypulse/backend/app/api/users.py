from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ..db.database import get_db
from ..models.user import UserPreferenceORM, UserPreferenceSchema, UserORM
from .auth import get_current_user

router = APIRouter()

@router.get("/preferences", response_model=UserPreferenceSchema)
async def get_preferences(current_user: UserORM = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserPreferenceORM).where(UserPreferenceORM.user_id == current_user.id))
    pref = result.scalars().first()
    if not pref:
        raise HTTPException(status_code=404, detail="Preferences not found")
    return pref

@router.put("/preferences", response_model=UserPreferenceSchema)
async def update_preferences(prefs: UserPreferenceSchema, current_user: UserORM = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserPreferenceORM).where(UserPreferenceORM.user_id == current_user.id))
    pref = result.scalars().first()
    if not pref:
        pref = UserPreferenceORM(user_id=current_user.id)
        db.add(pref)
    
    pref.home_city = prefs.home_city
    pref.home_zone = prefs.home_zone
    pref.latitude = prefs.latitude
    pref.longitude = prefs.longitude
    pref.alert_radius_km = prefs.alert_radius_km
    pref.alert_preferences = prefs.alert_preferences
    
    await db.commit()
    await db.refresh(pref)
    return pref
