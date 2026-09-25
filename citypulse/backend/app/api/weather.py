from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List

from ..providers.openweather import OpenWeatherProvider


router = APIRouter()


class CityResult(BaseModel):
    name: str
    state: str | None = None
    country: str
    latitude: float
    longitude: float


@router.get("/search", response_model=List[CityResult])
async def search_cities(
    q: str = Query(..., min_length=1)
):
    try:
        provider = OpenWeatherProvider()

        results = await provider.geocode(q)

        if not results:
            raise HTTPException(
                status_code=404,
                detail="Location not found"
            )

        return [
            CityResult(
                name=r.get("name", ""),
                state=r.get("state"),
                country=r.get("country", ""),
                latitude=r.get("lat"),
                longitude=r.get("lon")
            )
            for r in results
        ]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Geocoding service failed: {str(e)}"
        )


class WeatherResponse(BaseModel):
    city: str
    country: str
    latitude: float
    longitude: float

    temperature: float | None = None
    feels_like: float | None = None
    temperature_min: float | None = None
    temperature_max: float | None = None

    humidity: int | None = None
    pressure: int | None = None

    wind_speed: float | None = None
    wind_direction: int | None = None

    visibility: int | None = None
    cloudiness: int | None = None

    weather_main: str | None = None
    weather_description: str | None = None
    weather_icon: str | None = None

    sunrise: int | None = None
    sunset: int | None = None

    timestamp: int | None = None


@router.get("/current", response_model=WeatherResponse)
async def current_weather(
    lat: float = Query(...),
    lon: float = Query(...)
):
    try:
        provider = OpenWeatherProvider()

        data = await provider.fetch_current(lat, lon)

        if not data:
            raise HTTPException(
                status_code=502,
                detail="Failed to fetch weather data"
            )

        main = data.get("main", {})
        wind = data.get("wind", {})

        weather_list = data.get("weather", [])
        weather = weather_list[0] if weather_list else {}

        sys = data.get("sys", {})
        coord = data.get("coord", {})

        return WeatherResponse(
            city=data.get("name", "Unknown"),
            country=sys.get("country", ""),

            latitude=coord.get("lat", lat),
            longitude=coord.get("lon", lon),

            temperature=main.get("temp"),
            feels_like=main.get("feels_like"),
            temperature_min=main.get("temp_min"),
            temperature_max=main.get("temp_max"),

            humidity=main.get("humidity"),
            pressure=main.get("pressure"),

            wind_speed=wind.get("speed"),
            wind_direction=wind.get("deg"),

            visibility=data.get("visibility"),
            cloudiness=data.get("clouds", {}).get("all"),

            weather_main=weather.get("main"),
            weather_description=weather.get("description"),
            weather_icon=weather.get("icon"),

            sunrise=sys.get("sunrise"),
            sunset=sys.get("sunset"),

            timestamp=data.get("dt")
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Weather service failed: {str(e)}"
        )