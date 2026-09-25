from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import List, Optional, Dict, Any

from ..db.database import get_db
from ..models.feedback import FeedbackORM, FeedbackResponse, FeedbackCreate
from ..models.user import UserORM
from .auth import get_optional_current_user

router = APIRouter()

@router.get("/", response_model=List[FeedbackResponse])
async def list_feedback(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """
    Get history of submitted feedback records.
    """
    stmt = select(FeedbackORM).order_by(desc(FeedbackORM.created_at)).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/metrics")
async def get_feedback_metrics(
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Calculate dynamic model accuracy and agreement metrics from stored feedback data.
    """
    stmt = select(FeedbackORM)
    result = await db.execute(stmt)
    records = result.scalars().all()
    
    total_samples = len(records)
    if total_samples == 0:
        return {
            "total_samples": 0,
            "severity_agreement_rate": 0.0,
            "prediction_accuracy": 0.0,
            "mean_absolute_error": 0.0,
        }
    
    agreements = sum(
        1 for r in records if r.predicted_severity and r.actual_severity and r.predicted_severity.upper() == r.actual_severity.upper()
    )
    validated = sum(1 for r in records if r.is_validated or r.validation_status == "VALIDATED")
    
    agreement_rate = round((agreements / total_samples) * 100, 1)
    accuracy_rate = round((validated / total_samples) * 100, 1) if total_samples > 0 else 0.0
    
    # Calculate MAE for numerical features if available (e.g. AQI differences)
    mae_values = []
    for r in records:
        if r.observed_features and isinstance(r.observed_features, dict):
            if "aqi" in r.observed_features and "predicted_aqi" in r.observed_features:
                try:
                    mae_values.append(abs(float(r.observed_features["aqi"]) - float(r.observed_features["predicted_aqi"])))
                except (ValueError, TypeError):
                    pass
    
    mae = round(sum(mae_values) / len(mae_values), 2) if mae_values else 0.0
    
    return {
        "total_samples": total_samples,
        "severity_agreement_rate": agreement_rate,
        "prediction_accuracy": accuracy_rate,
        "mean_absolute_error": mae,
    }

@router.post("/", response_model=FeedbackResponse)
async def submit_feedback(
    feedback_data: FeedbackCreate,
    current_user: Optional[UserORM] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    new_feedback = FeedbackORM(
        user_id=user_id,
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
async def validate_feedback(
    feedback_id: int,
    status: str,
    current_user: Optional[UserORM] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
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
