from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Boolean, ForeignKey
from ..db import Base

class AnomalyORM(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    observation_id = Column(Integer, ForeignKey("observations.id"), nullable=True)
    city = Column(String, nullable=False, index=True)
    zone = Column(String, default="Central")
    data_type = Column(String, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    algorithm = Column(String, default="Rolling Z-Score")
    score = Column(Float, nullable=False)
    severity = Column(String, default="moderate") # normal, moderate, high, critical
    expected_value = Column(Float, nullable=True)
    actual_value = Column(Float, nullable=True)
    deviation = Column(String, nullable=True)
    is_confirmed = Column(Boolean, default=False)
    model_version = Column(String, default="v1.0-baseline")
    metadata_info = Column(JSON, nullable=True)

class CorrelationORM(Base):
    __tablename__ = "correlations"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, nullable=False, index=True)
    zone = Column(String, default="Central")
    feature_a = Column(String, nullable=False)
    feature_b = Column(String, nullable=False)
    time_window = Column(String, default="6h")
    correlation_coefficient = Column(Float, nullable=False)
    sample_size = Column(Integer, nullable=False)
    p_value_if_available = Column(Float, nullable=True)
    confidence = Column(Float, default=0.85)
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    interpretation = Column(String, nullable=False)
    model_version = Column(String, default="v1.0-pearson")

# Pydantic Schemas
class AnomalySchema(BaseModel):
    id: Optional[int] = None
    observation_id: Optional[int] = None
    city: str
    zone: str = "Central"
    data_type: str
    detected_at: datetime
    algorithm: str
    score: float
    severity: str
    expected_value: Optional[float] = None
    actual_value: Optional[float] = None
    deviation: Optional[str] = None
    is_confirmed: bool = False
    model_version: str = "v1.0-baseline"
    metadata_info: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class CorrelationSchema(BaseModel):
    id: Optional[int] = None
    city: str
    zone: str = "Central"
    feature_a: str
    feature_b: str
    time_window: str = "6h"
    correlation_coefficient: float
    sample_size: int
    p_value_if_available: Optional[float] = None
    confidence: float = 0.85
    detected_at: datetime
    interpretation: str
    model_version: str = "v1.0-pearson"

    class Config:
        from_attributes = True
