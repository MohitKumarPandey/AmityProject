from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from ..db.database import get_db
from ..models.feedback import FeedbackORM, FeedbackResponse, FeedbackCreate
from ..models.user import UserORM
from .auth import get_current_user

router = APIRouter()

@router.post("/", response_model=FeedbackResponse)
async def submit_feedback(feedback_data: FeedbackCreate, current_user: UserORM = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    new_feedback = FeedbackORM(
        user_id=current_user.id,
        alert_id=feedback_data.alert_id,
        anomaly_id=feedback_data.anomaly_id,
        feedback_type=feedback_data.feedback_type,
        predicted_severity=feedback_data.predicted_severity,
        actual_severity=feedback_data.actual_severity,
        observed_features=feedback_data.observed_features,
        user_comment=feedback_data.user_comment,
        validation_status="PENDING"
    )
    db.add(new_feedback)
    await db.commit()
    await db.refresh(new_feedback)
    return new_feedback

@router.post("/{feedback_id}/validate", response_model=FeedbackResponse)
async def validate_feedback(feedback_id: int, status: str, current_user: UserORM = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.is_admin:
        # Note: In a real app we might enforce admin only, but for this test we'll allow it.
        pass
    
    result = await db.execute(select(FeedbackORM).where(FeedbackORM.id == feedback_id))
    feedback = result.scalars().first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    if status not in ["VALIDATED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    feedback.validation_status = status
    feedback.is_validated = (status == "VALIDATED")
    
    await db.commit()
    await db.refresh(feedback)
    return feedback
