import os

routers = {
    "users": """from fastapi import APIRouter, Depends, HTTPException
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
""",
    "events": """from fastapi import APIRouter, Depends
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
""",
    "alerts": """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from ..db.database import get_db
from ..models.event import AlertORM, AlertSchema
from ..models.user import UserORM
from .auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[AlertSchema])
async def list_alerts(current_user: UserORM = Depends(get_current_user), limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AlertORM)
        .where(AlertORM.user_id == current_user.id)
        .order_by(desc(AlertORM.created_at))
        .limit(limit)
    )
    return result.scalars().all()

@router.post("/{alert_id}/read")
async def mark_read(alert_id: int, current_user: UserORM = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AlertORM).where(AlertORM.id == alert_id, AlertORM.user_id == current_user.id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    await db.commit()
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_read(current_user: UserORM = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AlertORM).where(AlertORM.user_id == current_user.id, AlertORM.is_read == False))
    alerts = result.scalars().all()
    for alert in alerts:
        alert.is_read = True
    await db.commit()
    return {"status": "success"}
""",
    "anomalies": """from fastapi import APIRouter, Depends
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
""",
    "correlations": """from fastapi import APIRouter, Depends
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
""",
    "feedback": """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from ..db.database import get_db
from ..models.feedback import FeedbackORM, FeedbackSchema, FeedbackCreate
from ..models.user import UserORM
from .auth import get_current_user

router = APIRouter()

@router.post("/", response_model=FeedbackSchema)
async def submit_feedback(feedback_data: FeedbackCreate, current_user: UserORM = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    new_feedback = FeedbackORM(
        user_id=current_user.id,
        alert_id=feedback_data.alert_id,
        anomaly_id=feedback_data.anomaly_id,
        feedback_type=feedback_data.feedback_type,
        predicted_severity=feedback_data.predicted_severity,
        actual_severity=feedback_data.actual_severity,
        observed_features=feedback_data.observed_features,
        user_comment=feedback_data.user_comment
    )
    db.add(new_feedback)
    await db.commit()
    await db.refresh(new_feedback)
    return new_feedback
""",
    "analytics": """from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db.database import get_db

router = APIRouter()

@router.get("/summary")
async def get_summary(city: str = None, db: AsyncSession = Depends(get_db)):
    return {"status": "ok", "message": "No historical data available yet."}
""",
    "providers": """from fastapi import APIRouter, Depends
from typing import List

router = APIRouter()

@router.get("/")
async def list_providers():
    return [
        {"name": "OpenAQ", "data_type": "Air Quality", "status": "LIVE", "is_simulated": False},
        {"name": "Open-Meteo", "data_type": "Weather", "status": "LIVE", "is_simulated": False},
        {"name": "SimulatedTransit", "data_type": "Transit", "status": "LIVE", "is_simulated": True},
        {"name": "SimulatedDisasters", "data_type": "Disasters", "status": "LIVE", "is_simulated": True}
    ]
""",
    "models": """from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from ..db.database import get_db
from ..models.feedback import ModelVersionORM, ModelVersionSchema

router = APIRouter()

@router.get("/", response_model=List[ModelVersionSchema])
async def list_models(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelVersionORM).order_by(desc(ModelVersionORM.created_at)))
    return result.scalars().all()
"""
}

base_path = "e:/AmityProject/citypulse/backend/app/api"
for name, content in routers.items():
    with open(f"{base_path}/{name}.py", "w", encoding="utf-8") as f:
        f.write(content)

print("Generated APIs")
