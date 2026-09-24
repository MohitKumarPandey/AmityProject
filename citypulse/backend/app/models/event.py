from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Boolean, ForeignKey
from ..db import Base

class CivicEventORM(Base):
    __tablename__ = "civic_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False, index=True) # FLOOD, STORM, AIR_QUALITY, FIRE, etc.
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    city = Column(String, nullable=False, index=True)
    zone = Column(String, default="Central")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    source = Column(String, default="Civic Monitoring Feed")
    source_event_id = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    status = Column(String, default="ACTIVE") # ACTIVE, RESOLVED
    radius_km = Column(Float, default=30.0)
    is_simulated = Column(Boolean, default=False, index=True)
    metadata_info = Column(JSON, nullable=True)

class AlertORM(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    event_id = Column(Integer, ForeignKey("civic_events.id"), nullable=True)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id"), nullable=True)
    alert_type = Column(String, nullable=False) # NEARBY_DISASTER, ENVIRONMENTAL, TRAFFIC, ANOMALY
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    severity = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    source_city = Column(String, nullable=False)
    target_city = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime, nullable=True)
    is_read = Column(Boolean, default=False)
    delivery_status = Column(String, default="DELIVERED")
    metadata_info = Column(JSON, nullable=True)

# Pydantic Schemas
class CivicEventSchema(BaseModel):
    id: Optional[int] = None
    event_type: str
    title: str
    description: str
    city: str
    zone: str = "Central"
    latitude: float
    longitude: float
    severity: str = "MEDIUM"
    source: str = "Civic Monitoring Feed"
    started_at: datetime
    status: str = "ACTIVE"
    radius_km: float = 30.0
    is_simulated: bool = False
    metadata_info: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class AlertSchema(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    event_id: Optional[int] = None
    anomaly_id: Optional[int] = None
    alert_type: str
    title: str
    message: str
    severity: str
    source_city: str
    target_city: str
    distance_km: float
    created_at: datetime
    is_read: bool = False
    delivery_status: str = "DELIVERED"
    metadata_info: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
