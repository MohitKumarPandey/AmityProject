import httpx
import asyncio
import os

async def test_apis():
    async with httpx.AsyncClient() as client:
        # Test Open-Meteo Air Quality API
        r_om = await client.get(
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            params={
                "latitude": 26.9124,
                "longitude": 75.7878,
                "current": ["us_aqi", "pm10", "pm2_5"],
            }
        )
        print("Open-Meteo AQ Status:", r_om.status_code)
        if r_om.status_code == 200:
            print("Open-Meteo AQ Data:", r_om.json().get("current"))
        else:
            print("Open-Meteo AQ Error:", r_om.text)

        # Test OpenAQ v3 API with X-API-Key header if provided
        api_key = os.getenv("OPENAQ_API_KEY", "")
        headers = {"X-API-Key": api_key} if api_key else {}
        r_openaq = await client.get(
            "https://api.openaq.org/v3/locations",
            params={"coordinates": "26.9124,75.7878"},
            headers=headers
        )
        print("OpenAQ v3 Status:", r_openaq.status_code)
        print("OpenAQ v3 Response:", r_openaq.text[:300])

if __name__ == "__main__":
    asyncio.run(test_apis())
