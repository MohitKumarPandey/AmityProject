import httpx
import os
from datetime import datetime
from typing import Dict, Any, List

from ..models.observation import Observation
from .base import BaseProvider


class OpenWeatherProvider(BaseProvider):
    WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
    GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/direct"

    TILE_URL_TEMPLATE = (
        "https://tile.openweathermap.org/map/"
        "{layer}/{z}/{x}/{y}.png?appid={api_key}"
    )

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENWEATHER_API_KEY")

        if not self.api_key:
            raise ValueError(
                "OPENWEATHER_API_KEY not set in environment"
            )
    async def fetch_current(self, lat: float, lon: float) -> Dict[str, Any]:
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric",
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(self.WEATHER_URL, params=params)
            response.raise_for_status()
            return response.json()

    async def geocode(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        params = {
            "q": query,
            "limit": limit,
            "appid": self.api_key,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(self.GEOCODE_URL, params=params)
            response.raise_for_status()
            return response.json()

    def to_observation(self, raw: Dict[str, Any], city_name: str, lat: float, lon: float) -> Observation:
        # Map OpenWeather fields to Observation model (used for other analytics)
        main = raw.get("main", {})
        wind = raw.get("wind", {})
        weather = raw.get("weather", [{}])[0]
        return Observation(
            city=city_name,
            latitude=lat,
            longitude=lon,
            timestamp=datetime.utcfromtimestamp(raw.get("dt", datetime.utcnow().timestamp())),
            temperature_c=main.get("temp"),
            humidity_percent=main.get("humidity"),
            aqi=None,  # OpenWeather does not provide AQI in this endpoint
            source="openweather",
            is_simulated=False,
            raw=raw,
        )

    @classmethod
    def tile_url(cls, layer: str, api_key: str = None) -> str:
        key = api_key or os.getenv("OPENWEATHER_API_KEY")
        return cls.TILE_URL_TEMPLATE.format(layer=layer, api_key=key)