import asyncio
import logging
from backend.app.db import AsyncSessionLocal, Base, engine
from backend.app.services.ingestion import ingest_all_cities
from backend.app.repository.observation import list_observations

logging.basicConfig(level=logging.INFO)

async def run_test():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        print("Starting real ingestion from Open-Meteo and OpenAQ...")
        results = await ingest_all_cities(session)
        print("Ingestion results:", results)
        
        observations = await list_observations(session, limit=100)
        print(f"Total observations in DB: {len(observations)}")
        for o in observations[:5]:
            print(f"- [{o.source}] {o.city}: temp={o.temperature_c}°C, humidity={o.humidity_percent}%, aqi={o.aqi}, time={o.timestamp}")

if __name__ == "__main__":
    asyncio.run(run_test())
