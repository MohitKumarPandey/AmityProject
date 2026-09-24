from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Boolean
from ..db import Base

class Observation(BaseModel):
    id: Optional[int] = Field(None, description="Database primary key")
    source: str = Field(..., description="Source identifier, e.g. 'open-meteo', 'openaq'")
    data_type: str = Field("environmental", description="Data type: weather, air_quality, transit, disaster")
    city: str = Field(..., description="City name")
    zone: Optional[str] = Field("Central", description="City zone/district")
    latitude: float = Field(..., description="Latitude")
    longitude: float = Field(..., description="Longitude")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC timestamp")
    severity: str = Field("normal", description="Severity level: normal, moderate, high, critical")
    metric: Optional[str] = Field(None, description="Specific metric name e.g. temperature, pm25")
    value: Optional[float] = Field(None, description="Metric numeric value")
    unit: Optional[str] = Field(None, description="Unit e.g. °C, %, µg/m³")
    status: str = Field("active", description="Status")
    temperature_c: Optional[float] = Field(None, description="Temperature in Celsius")
    humidity_percent: Optional[float] = Field(None, description="Relative humidity percentage")
    aqi: Optional[int] = Field(None, description="Air Quality Index")
    metadata_info: Optional[Dict[str, Any]] = Field(default_factory=dict)
    raw: Optional[Dict[str, Any]] = Field(None, description="Raw provider payload")
    is_simulated: bool = Field(False, description="Flag indicating if data is simulated")

    class Config:
        from_attributes = True

class ObservationORM(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False, index=True)
    data_type = Column(String, default="environmental", index=True)
    city = Column(String, nullable=False, index=True)
    zone = Column(String, default="Central")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    severity = Column(String, default="normal")
    metric = Column(String, nullable=True)
    value = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    status = Column(String, default="active")
    temperature_c = Column(Float, nullable=True)
    humidity_percent = Column(Float, nullable=True)
    aqi = Column(Integer, nullable=True)
    metadata_info = Column(JSON, nullable=True)
    raw = Column(JSON, nullable=True)
    is_simulated = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
