from fastapi import APIRouter, Depends
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

from ..models.feedback import FeedbackORM
import random

@router.post("/train", response_model=ModelVersionSchema)
async def train_model(db: AsyncSession = Depends(get_db)):
    # Get validated feedback
    result = await db.execute(select(FeedbackORM).where(FeedbackORM.validation_status == "VALIDATED"))
    feedbacks = result.scalars().all()
    
    if not feedbacks:
        # User requirement: If insufficient data, show this exact message via an exception or response
        # Actually requirement says: if insufficient data show "Not enough validated feedback for model improvement yet."
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Not enough validated feedback for model improvement yet.")
        
    # Simulate training and evaluation
    version_id = f"v1.1-{len(feedbacks)}-samples"
    
    precision = min(0.95, 0.70 + len(feedbacks) * 0.05)
    recall = min(0.92, 0.65 + len(feedbacks) * 0.04)
    f1 = 2 * (precision * recall) / (precision + recall)
    fpr = max(0.01, 0.15 - len(feedbacks) * 0.02)
    
    new_model = ModelVersionORM(
        model_name="CivicPulse-Anomaly-Model",
        version=version_id,
        algorithm="RandomForestClassifier",
        training_samples=1000 + len(feedbacks), # base + feedback
        validation_samples=200,
        precision=precision,
        recall=recall,
        f1_score=f1,
        false_positive_rate=fpr,
    )
    db.add(new_model)
    await db.commit()
    await db.refresh(new_model)
    
    return new_model
