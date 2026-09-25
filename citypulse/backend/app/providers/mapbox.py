from __future__ import annotations

import os
import httpx
from typing import List, Dict, Any

class MapboxProvider:
    """Provider for Mapbox services: geocoding, POI search, routing, and static map tiles."""

    GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json"
    PLACES_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json"
    DIRECTIONS_URL = "https://api.mapbox.com/directions/v5/mapbox/{profile}/{coordinates}.json"
    TILE_STYLE_URL = "mapbox://styles/mapbox/streets-v11"

    def __init__(self, token: str = None):
        self.token = token or os.getenv("MAPBOX_ACCESS_TOKEN")
        if not self.token:
            raise ValueError("MAPBOX_ACCESS_TOKEN not set in environment")

    async def _get(self, url: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        params = params or {}
        params["access_token"] = self.token
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()

    async def geocode(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Forward geocode a place name.
        Returns a list of candidate features with name, place_name, centre (lon, lat), etc.
        """
        url = self.GEOCODE_URL.format(query=httpx.URL.encode_query(query))
        data = await self._get(url, {"limit": limit})
        return data.get("features", [])

    async def search_places(self, query: str, proximity: List[float] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Search POI/places using Mapbox Geocoding with type=poi.
        proximity should be [lon, lat] to bias results.
        """
        url = self.PLACES_URL.format(query=httpx.URL.encode_query(query))
        params = {"limit": limit, "types": "poi"}
        if proximity:
            params["proximity"] = ",".join(map(str, proximity))
        data = await self._get(url, params)
        return data.get("features", [])

    async def get_route(self, profile: str, coordinates: List[List[float]], alternatives: bool = False) -> Dict[str, Any]:
        """Get a route from Mapbox Directions API.
        profile: driving, walking, cycling
        coordinates: list of [lon, lat] pairs (origin, destination, ...)
        Returns the raw JSON response.
        """
        coord_str = ";".join([f"{lon},{lat}" for lon, lat in coordinates])
        url = self.DIRECTIONS_URL.format(profile=profile, coordinates=coord_str)
        params = {"geometries": "geojson", "overview": "full", "steps": "true", "alternatives": str(alternatives).lower()}
        return await self._get(url, params)

