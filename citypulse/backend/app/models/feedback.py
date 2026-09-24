from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Boolean, ForeignKey
from ..db import Base

class FeedbackORM(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    observation_id = Column(Integer, ForeignKey("observations.id"), nullable=True)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id"), nullable=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)

    feedback_type = Column(String, default="alert_usefulness") # alert_usefulness, severity_correction, feature_observation
    predicted_label = Column(String, nullable=True)
    actual_label = Column(String, nullable=True)

    predicted_severity = Column(String, nullable=True)
    actual_severity = Column(String, nullable=True)

    model_version = Column(String, default="v1.0-baseline")
    prediction_score = Column(Float, nullable=True)

    observed_features = Column(JSON, nullable=True) # Observed human values e.g. {"aqi": 110, "traffic_delay": 15}
    user_comment = Column(String, nullable=True)

    is_validated = Column(Boolean, default=False)
    validation_status = Column(String, default="PENDING") # PENDING, VALIDATED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class ModelVersionORM(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False)
    version = Column(String, nullable=False, unique=True)
    algorithm = Column(String, nullable=False)
    training_data_version = Column(String, default="v1.0")
    training_samples = Column(Integer, default=0)
    validation_samples = Column(Integer, default=0)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    false_positive_rate = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

# Pydantic Schemas
class FeedbackCreate(BaseModel):
    observation_id: Optional[int] = None
    anomaly_id: Optional[int] = None
    alert_id: Optional[int] = None
    feedback_type: str = "alert_usefulness"
    predicted_label: Optional[str] = None
    actual_label: Optional[str] = None
    predicted_severity: Optional[str] = None
    actual_severity: Optional[str] = None
    model_version: Optional[str] = "v1.0-baseline"
    prediction_score: Optional[float] = None
    observed_features: Optional[Dict[str, Any]] = None
    user_comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    feedback_type: str
    predicted_severity: Optional[str] = None
    actual_severity: Optional[str] = None
    validation_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ModelVersionSchema(BaseModel):
    id: int
    model_name: str
    version: str
    algorithm: str
    training_samples: int
    validation_samples: int
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    false_positive_rate: Optional[float] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
