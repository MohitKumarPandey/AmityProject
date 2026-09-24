import os
from pathlib import Path
from typing import List, Tuple

# Load environment variables from .env if present (already done in db module)
# Configuration keys

# Comma‑separated list of city names to ingest, e.g. "Jaipur,Delhi,Mumbai,London,New York"
INGESTION_CITIES = os.getenv("INGESTION_CITIES", "Jaipur,Delhi,Mumbai,London,New York")

# Interval in minutes for the ingestion scheduler
INGESTION_INTERVAL_MINUTES = int(os.getenv("INGESTION_INTERVAL_MINUTES", "30"))

# Optional mapping of city to (lat, lon) if you want to provide them explicitly.
# Format: "City1:lat1,lon1;City2:lat2,lon2"
_DEFAULT_POSITIONS = "Jaipur:26.9124,75.7878;Delhi:28.7041,77.1025;Mumbai:19.0760,72.8777;London:51.5074,-0.1278;New York:40.7128,-74.0060"
_CITY_POSITIONS_RAW = os.getenv("CITY_POSITIONS", _DEFAULT_POSITIONS)

def parse_city_positions(raw: str) -> dict[str, Tuple[float, float]]:
    """Parse CITY_POSITIONS env var into a dict ``{city: (lat, lon)}``.
    Example value: "Jaipur:26.9124,75.7878;Delhi:28.7041,77.1025"
    """
    mapping: dict[str, Tuple[float, float]] = {}
    if not raw:
        return mapping
    for entry in raw.split(";"):
        if not entry:
            continue
        try:
            city, coords = entry.split(":")
            lat_str, lon_str = coords.split(",")
            mapping[city.strip()] = (float(lat_str), float(lon_str))
        except Exception:
            # Silently ignore malformed entries
            continue
    return mapping

CITY_POSITIONS = parse_city_positions(_CITY_POSITIONS_RAW)

def get_cities_list() -> List[str]:
    """Return a list of city names to ingest.
    Empty string results in an empty list.
    """
    if not INGESTION_CITIES:
        return []
    return [c.strip() for c in INGESTION_CITIES.split(",") if c.strip()]

