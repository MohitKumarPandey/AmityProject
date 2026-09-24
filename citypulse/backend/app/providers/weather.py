import httpx
import random
from datetime import datetime
from typing import Dict, Any

from ..models.observation import Observation
from .base import BaseProvider

_CITY_SEEDS: Dict[str, Dict] = {
    "Jaipur":   {"temp": 32.0, "humid": 55.0, "aqi": 95},
    "Delhi":    {"temp": 30.0, "humid": 68.0, "aqi": 140},
    "Mumbai":   {"temp": 29.0, "humid": 80.0, "aqi": 85},
    "London":   {"temp": 14.0, "humid": 78.0, "aqi": 40},
    "New York": {"temp": 22.0, "humid": 65.0, "aqi": 55},
}
_DEFAULT_SEED = {"temp": 25.0, "humid": 65.0, "aqi": 75}


class OpenMeteoWeatherProvider(BaseProvider):
    """Fetch current weather from Open-Meteo. Falls back to simulated data on 429."""

    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    def __init__(self, city: str, latitude: float, longitude: float):
        self.city = city
        self.latitude = latitude
        self.longitude = longitude
        self.params = {
            "latitude": latitude,
            "longitude": longitude,
            "current_weather": "true",
            "hourly": "relativehumidity_2m",
            "timezone": "UTC",
        }

    async def fetch(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(self.BASE_URL, params=self.params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                return self._simulated_fallback()
            raise
        except Exception:
            return self._simulated_fallback()

    def _simulated_fallback(self) -> Dict[str, Any]:
        seed = _CITY_SEEDS.get(self.city, _DEFAULT_SEED)
        return {
            "_simulated": True,
            "current_weather": {
                "temperature": round(seed["temp"] + random.uniform(-3, 3), 1),
                "time": datetime.utcnow().isoformat(),
            },
            "hourly": {
                "relativehumidity_2m": [round(min(100, seed["humid"] + random.uniform(-8, 8)), 1)]
            },
            "_aqi": max(0, int(seed["aqi"] + random.randint(-20, 20))),
        }

    def to_observation(self, raw: Dict[str, Any]) -> Observation:
        cw = raw.get("current") or raw.get("current_weather") or {}

        temp = cw.get("temperature_2m") if "temperature_2m" in cw else cw.get("temperature")

        humidity = cw.get("relative_humidity_2m") if "relative_humidity_2m" in cw else cw.get("relativehumidity_2m")
        if humidity is None:
            hourly = raw.get("hourly", {})
            vals = hourly.get("relativehumidity_2m", []) or hourly.get("relative_humidity_2m", [])
            humidity = vals[0] if vals else None

        time_val = cw.get("time")
        if isinstance(time_val, (int, float)):
            obs_time = datetime.utcfromtimestamp(time_val)
        elif isinstance(time_val, str):
            try:
                obs_time = datetime.fromisoformat(time_val)
            except Exception:
                obs_time = datetime.utcnow()
        else:
            obs_time = datetime.utcnow()

        is_sim = bool(raw.get("_simulated"))
        aqi = raw.get("_aqi")

        return Observation(
            city=self.city,
            latitude=self.latitude,
            longitude=self.longitude,
            timestamp=obs_time,
            temperature_c=float(temp) if temp is not None else None,
            humidity_percent=float(humidity) if humidity is not None else None,
            aqi=aqi,
            source="open-meteo" if not is_sim else "Simulated Weather",
            is_simulated=is_sim,
            raw=raw,
        )


class SimulatedWeatherProvider(BaseProvider):
    """Always-simulated fallback used for testing / seeding."""

    def __init__(self, city: str, latitude: float, longitude: float):
        self.city = city
        self.latitude = latitude
        self.longitude = longitude

    async def fetch(self) -> Dict[str, Any]:
        seed = _CITY_SEEDS.get(self.city, _DEFAULT_SEED)
        return {
            "temperature_c": round(seed["temp"] + random.uniform(-3, 3), 1),
            "humidity_percent": round(min(100, seed["humid"] + random.uniform(-8, 8)), 1),
            "aqi": max(0, int(seed["aqi"] + random.randint(-20, 20))),
        }

    def to_observation(self, raw: Dict[str, Any]) -> Observation:
        return Observation(
            city=self.city,
            latitude=self.latitude,
            longitude=self.longitude,
            timestamp=datetime.utcnow(),
            temperature_c=raw.get("temperature_c"),
            humidity_percent=raw.get("humidity_percent"),
            aqi=raw.get("aqi"),
            source="Simulated Weather",
            is_simulated=True,
            raw=raw,
        )
