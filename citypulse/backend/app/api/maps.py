from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
import os
import httpx
from ..providers.mapbox import MapboxProvider

router = APIRouter()

@router.get("/search")
async def search_locations(q: str = Query(..., min_length=1)) -> List[Dict[str, Any]]:
    """
    Search location/city using Mapbox or OpenStreetMap Nominatim.
    Returns normalized list of search results.
    """
    results = []
    
    # Try Mapbox first if token is available
    token = os.getenv("MAPBOX_ACCESS_TOKEN") or os.getenv("VITE_MAPBOX_TOKEN")
    if token:
        try:
            provider = MapboxProvider(token=token)
            features = await provider.geocode(q)
            for f in features:
                coords = f.get("center", [0, 0])
                results.append({
                    "id": f.get("id"),
                    "name": f.get("text") or f.get("place_name"),
                    "display_name": f.get("place_name"),
                    "place_name": f.get("place_name"),
                    "latitude": coords[1],
                    "longitude": coords[0],
                    "center": coords,
                    "city": f.get("text"),
                    "country": f.get("context", [{}])[-1].get("text", "") if f.get("context") else ""
                })
            if results:
                return results
        except Exception as e:
            print(f"Mapbox geocode error: {e}")

    # Fallback to OpenStreetMap Nominatim (Real global geocoding API)
    headers = {"User-Agent": "CityPulse-Geocoding-Service/1.0"}
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": q, "format": "json", "addressdetails": 1, "limit": 5}
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(url, params=params, headers=headers)
            if res.status_code == 200:
                data = res.json()
                for item in data:
                    lat = float(item["lat"])
                    lon = float(item["lon"])
                    display_name = item.get("display_name", "")
                    name = item.get("name") or display_name.split(",")[0]
                    address = item.get("address", {})
                    city = address.get("city") or address.get("town") or address.get("village") or name
                    country = address.get("country", "")
                    
                    results.append({
                        "id": str(item.get("place_id")),
                        "name": name,
                        "display_name": display_name,
                        "place_name": display_name,
                        "latitude": lat,
                        "longitude": lon,
                        "center": [lon, lat],
                        "city": city,
                        "country": country
                    })
        except Exception as e:
            print(f"Nominatim geocode error: {e}")
            
    return results

@router.get("/places")
async def get_places(
    q: str = Query("point of interest"),
    lat: Optional[float] = None,
    lon: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Search places/POIs near lat/lon using Mapbox or Nominatim.
    """
    token = os.getenv("MAPBOX_ACCESS_TOKEN") or os.getenv("VITE_MAPBOX_TOKEN")
    if token:
        try:
            provider = MapboxProvider(token=token)
            proximity = [lon, lat] if (lat is not None and lon is not None) else None
            features = await provider.search_places(q, proximity=proximity)
            places = []
            for f in features:
                coords = f.get("center", [0, 0])
                places.append({
                    "id": f.get("id"),
                    "name": f.get("text"),
                    "category": f.get("properties", {}).get("category", "POI"),
                    "latitude": coords[1],
                    "longitude": coords[0],
                    "place_name": f.get("place_name")
                })
            return places
        except Exception as e:
            print(f"Mapbox places error: {e}")

    if lat is not None and lon is not None:
        headers = {"User-Agent": "CityPulse-Geocoding-Service/1.0"}
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": q, "format": "json", "limit": 10}
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return [
                        {
                            "id": str(item.get("place_id")),
                            "name": item.get("display_name", "").split(",")[0],
                            "category": "POI",
                            "latitude": float(item["lat"]),
                            "longitude": float(item["lon"]),
                            "place_name": item.get("display_name")
                        }
                        for item in data
                    ]
            except Exception as e:
                print(f"Nominatim places error: {e}")
    return []

@router.get("/route")
async def get_route(
    profile: str = "driving",
    origin: str = Query(...),
    destination: str = Query(...),
    alternatives: bool = False
) -> Dict[str, Any]:
    token = os.getenv("MAPBOX_ACCESS_TOKEN") or os.getenv("VITE_MAPBOX_TOKEN")
    if token:
        try:
            orig_parts = [float(x.strip()) for x in origin.split(",")]
            dest_parts = [float(x.strip()) for x in destination.split(",")]
            provider = MapboxProvider(token=token)
            coords = [[orig_parts[1], orig_parts[0]], [dest_parts[1], dest_parts[0]]]
            return await provider.get_route(profile, coords, alternatives)
        except Exception as e:
            print(f"Route error: {e}")
    return {"routes": []}
