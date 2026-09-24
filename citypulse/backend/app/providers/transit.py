from typing import Any
import random
from datetime import datetime
from .base import BaseProvider
from ..models.observation import Observation


class SimulatedTransitProvider(BaseProvider):
    """Simulated transit delay provider. Always marked is_simulated=True."""

    def __init__(self, city: str, lat: float, lon: float):
        self.city = city
        self.lat = lat
        self.lon = lon

    async def fetch(self) -> dict[str, Any]:
        delay_minutes = random.uniform(0, 45)
        severity = "normal"
        if delay_minutes > 15:
            severity = "moderate"
        if delay_minutes > 30:
            severity = "high"

        return {
            "source": "Simulated Transit",
            "metric": "transit_delay",
            "value": round(delay_minutes, 1),
            "unit": "min",
            "severity": severity,
            "metadata_info": {"notes": "Simulated random transit delays"},
        }

    def to_observation(self, raw: dict) -> Observation:
        return Observation(
            source=raw["source"],
            data_type="transit",
            city=self.city,
            zone="Central",
            latitude=self.lat,
            longitude=self.lon,
            timestamp=datetime.utcnow(),
            metric=raw["metric"],
            value=raw["value"],
            unit=raw["unit"],
            severity=raw["severity"],
            status="active",
            is_simulated=True,
            metadata_info=raw["metadata_info"],
            raw=raw,
        )
