import httpx
import os
from datetime import datetime
from typing import Dict, Any, List, Optional

from ..models.observation import Observation
from .base import BaseProvider


class OpenAQProvider(BaseProvider):
    """Fetch air quality data from the OpenAQ v3 API or real Open-Meteo Air Quality service.

    Follows the provider contract:
    - ``fetch`` returns the raw JSON payload from the API.
    - ``to_observation`` converts that raw payload into an ``Observation`` instance.
    """

    OPENAQ_V3_URL = "https://api.openaq.org/v3/locations"
    OPEN_METEO_AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
    TIMEOUT = 10.0

    def __init__(self, city: str, latitude: float, longitude: float):
        self.city = city
        self.latitude = latitude
        self.longitude = longitude
        self.api_key = os.getenv("OPENAQ_API_KEY")

    async def fetch(self) -> Dict[str, Any]:
        """Perform an HTTP GET request for air quality data.
        Tries OpenAQ v3 if API key is available, else uses Open-Meteo Air Quality API.
        """
        headers = {}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
            params = {
                "coordinates": f"{self.latitude},{self.longitude}",
                "limit": "100",
            }
            url = self.OPENAQ_V3_URL
        else:
            url = self.OPEN_METEO_AQ_URL
            params = {
                "latitude": self.latitude,
                "longitude": self.longitude,
                "current": ["us_aqi", "pm10", "pm2_5"],
            }

        async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
            try:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
                return response.json()
            except Exception as exc:
                # If OpenAQ fails, try Open-Meteo Air Quality as fallback for real data
                if url != self.OPEN_METEO_AQ_URL:
                    fallback_params = {
                        "latitude": self.latitude,
                        "longitude": self.longitude,
                        "current": ["us_aqi", "pm10", "pm2_5"],
                    }
                    fallback_resp = await client.get(self.OPEN_METEO_AQ_URL, params=fallback_params)
                    fallback_resp.raise_for_status()
                    return fallback_resp.json()
                raise RuntimeError(f"Air Quality API error: {exc}")

    def to_observation(self, raw: Dict[str, Any]) -> Observation:
        """Convert raw payload into an Observation model."""
        current = raw.get("current", {})
        us_aqi = current.get("us_aqi")

        # Parse timestamp if available
        time_val = current.get("time")
        if isinstance(time_val, str):
            try:
                obs_time = datetime.fromisoformat(time_val)
            except Exception:
                obs_time = datetime.utcnow()
        else:
            obs_time = datetime.utcnow()

        # If OpenAQ v3 results structure
        results = raw.get("results", [])
        if results and us_aqi is None:
            for r in results:
                for m in r.get("sensors", []):
                    if m.get("parameter", {}).get("name") == "aqi":
                        us_aqi = int(m.get("latest", {}).get("value", 0))

        obs = Observation(
            city=self.city,
            latitude=self.latitude,
            longitude=self.longitude,
            timestamp=obs_time,
            temperature_c=None,
            humidity_percent=None,
            aqi=int(us_aqi) if us_aqi is not None else None,
            source="openaq",
            raw=raw,
        )
        return obs

