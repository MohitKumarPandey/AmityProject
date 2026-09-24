import random
from typing import Any
from datetime import datetime
from .base import BaseProvider
from ..models.event import CivicEventSchema

class SimulatedDisasterProvider(BaseProvider):
    def __init__(self, city: str, lat: float, lon: float):
        self.city = city
        self.lat = lat
        self.lon = lon

    async def fetch(self) -> dict[str, Any]:
        # 10% chance of an event happening during ingestion
        has_event = random.random() < 0.1
        if not has_event:
            return {}

        events = ["FLOOD", "EARTHQUAKE", "STORM", "POWER_OUTAGE", "FIRE", "TRAFFIC_INCIDENT"]
        event_type = random.choice(events)
        severities = ["MEDIUM", "HIGH", "CRITICAL"]
        severity = random.choice(severities)
        
        # offset coordinates slightly for realism
        event_lat = self.lat + random.uniform(-0.1, 0.1)
        event_lon = self.lon + random.uniform(-0.1, 0.1)

        return {
            "event_type": event_type,
            "title": f"Simulated {event_type.replace('_', ' ').title()}",
            "description": f"A simulated {severity.lower()} {event_type.replace('_', ' ').title()} event.",
            "city": self.city,
            "zone": "Random Zone",
            "latitude": event_lat,
            "longitude": event_lon,
            "severity": severity,
            "source": "Simulated Disaster Provider",
            "radius_km": random.uniform(10, 60),
        }

    def to_event(self, raw: dict) -> CivicEventSchema | None:
        if not raw:
            return None
        return CivicEventSchema(
            event_type=raw["event_type"],
            title=raw["title"],
            description=raw["description"],
            city=raw["city"],
            zone=raw["zone"],
            latitude=raw["latitude"],
            longitude=raw["longitude"],
            severity=raw["severity"],
            source=raw["source"],
            started_at=datetime.utcnow(),
            status="ACTIVE",
            radius_km=raw["radius_km"],
            is_simulated=True,
            metadata_info={"simulated": True}
        )
