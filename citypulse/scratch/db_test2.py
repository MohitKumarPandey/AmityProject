import os, asyncio
from sqlalchemy.ext.asyncio import create_async_engine

url = os.getenv('DATABASE_URL', 'postgresql+asyncpg://citypulse:password@localhost:5432/citypulse')
engine = create_async_engine(url, echo=False, future=True)

async def test():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(lambda sync_conn: None)
        print('Connection OK')
    except Exception as e:
        print('Connection error:', e)

asyncio.run(test())
