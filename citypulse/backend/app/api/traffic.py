from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
import httpx
import os

router = APIRouter()

@router.get("/incidents")
async def get_traffic_incidents(bbox: Optional[str] = Query(None)) -> Dict[str, Any]:
    """
    Fetch real traffic incidents via TomTom API or external traffic providers.
    """
    tomtom_key = os.getenv("TOMTOM_API_KEY")
    if tomtom_key and bbox:
        url = "https://api.tomtom.com/traffic/services/5/incidentDetails"
        params = {
            "key": tomtom_key,
            "bbox": bbox,
            "fields": "{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code}}}}"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    return res.json()
            except Exception as e:
                print(f"TomTom traffic error: {e}")
    
    return {"incidents": []}

@router.get("/flow")
async def get_traffic_flow(zoom: int = 10, x: int = 0, y: int = 0) -> Dict[str, Any]:
    return {"flow": []}
