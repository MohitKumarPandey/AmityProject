from fastapi import APIRouter, Query
from typing import Dict, Any

router = APIRouter()

@router.get("/route")
async def get_transit_route(
    origin: str = Query(...),
    destination: str = Query(...),
    departure_time: str = "now",
    alternatives: bool = False
) -> Dict[str, Any]:
    return {"routes": [], "status": "no_data"}
