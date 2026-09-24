import os
import sys
import logging
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://citypulse:password@localhost:5432/citypulse")

# Default engine configuration
def get_engine() -> AsyncEngine:
    url = DATABASE_URL
    # Check if user requested postgresql
    if "postgresql" in url:
        # Test socket connection to localhost:5432
        import socket
        try:
            s = socket.create_connection(("localhost", 5432), timeout=1)
            s.close()
        except Exception:
            logger.warning("PostgreSQL server at localhost:5432 is not reachable. Using SQLite fallback for local application execution.")
            url = "sqlite+aiosqlite:///./citypulse.db"
    return create_async_engine(url, echo=False, future=True)

engine: AsyncEngine = get_engine()

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session



