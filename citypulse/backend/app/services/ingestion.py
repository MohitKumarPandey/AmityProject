"""Ingestion service - coordinates weather, air quality, transit providers."""
from __future__ import annotations

import logging
from typing import Dict, List, Any

from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_cities_list, CITY_POSITIONS
from ..providers.openweather import OpenWeatherProvider
from ..providers.openaq import OpenAQProvider
from ..providers.transit import SimulatedTransitProvider
from ..repository.observation import persist_observation

logger = logging.getLogger(__name__)


async def ingest_city(city: str, latitude: float, longitude: float, db: AsyncSession) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "city": city,
        "weather_success": False,
        "weather_error": None,
        "air_quality_success": False,
        "air_quality_error": None,
        "transit_success": False,
        "transit_error": None,
    }

    # Weather (real data from Open-Meteo)
    try:
        weather_provider = OpenWeatherProvider()
        raw_weather = await weather_provider.fetch_current(latitude, longitude)
        obs_weather = weather_provider.to_observation(raw_weather, city, latitude, longitude)
        await persist_observation(db, obs_weather)
        result["weather_success"] = True
    except Exception as exc:
        logger.exception("Weather ingestion failed for %s: %s", city, exc)
        result["weather_error"] = str(exc)

    # Air Quality (real data from Open-Meteo AQ API, OpenAQ if key available)
    try:
        aq_provider = OpenAQProvider(city, latitude, longitude)
        raw_aq = await aq_provider.fetch()
        obs_aq = aq_provider.to_observation(raw_aq)
        await persist_observation(db, obs_aq)
        result["air_quality_success"] = True
    except Exception as exc:
        logger.exception("OpenAQ ingestion failed for %s: %s", city, exc)
        result["air_quality_error"] = str(exc)

    # Transit (simulated - clearly marked is_simulated=True)
    try:
        transit_provider = SimulatedTransitProvider(city, latitude, longitude)
        raw_transit = await transit_provider.fetch()
        obs_transit = transit_provider.to_observation(raw_transit)
        await persist_observation(db, obs_transit)
        result["transit_success"] = True
    except Exception as exc:
        logger.exception("Transit ingestion failed for %s: %s", city, exc)
        result["transit_error"] = str(exc)

    return result


async def ingest_all_cities(db: AsyncSession) -> List[Dict[str, Any]]:
    cities = get_cities_list()
    results: List[Dict[str, Any]] = []
    for city in cities:
        coords = CITY_POSITIONS.get(city)
        if not coords:
            logger.warning("Coordinates for %s not found; skipping", city)
            continue
        lat, lon = coords
        city_result = await ingest_city(city, lat, lon, db)
        results.append(city_result)
    return results
