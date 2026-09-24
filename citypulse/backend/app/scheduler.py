import logging
from datetime import datetime
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .config import INGESTION_INTERVAL_MINUTES
from .services.ingestion import ingest_all_cities
from .db import AsyncSessionLocal

logger = logging.getLogger(__name__)

# Create a global scheduler instance
scheduler = AsyncIOScheduler()

async def _run_ingestion_job() -> None:
    """Background job that runs the ingestion service.

    The function obtains a fresh async DB session, invokes ``ingest_all_cities``
    and logs the outcome. Any exception is caught and logged so that the
    scheduler continues running even if a single run fails.
    """
    async with AsyncSessionLocal() as session:
        try:
            results = await ingest_all_cities(session)
            logger.info(
                "Ingestion job completed at %s with results: %s",
                datetime.utcnow().isoformat(),
                results,
            )
        except Exception as e:  # pragma: no cover
            logger.error("Ingestion job failed: %s", e)

def start_scheduler(app: FastAPI) -> None:
    """Start the APScheduler when the FastAPI app starts.

    The scheduler is configured to run ``_run_ingestion_job`` at the interval
    defined by ``INGESTION_INTERVAL_MINUTES``. Duplicate jobs are avoided on
    successive start‑up events (e.g., during hot‑reload) by checking ``get_jobs``.
    """
    interval = INGESTION_INTERVAL_MINUTES
    if not scheduler.get_jobs():
        scheduler.add_job(
            _run_ingestion_job,
            trigger=IntervalTrigger(minutes=interval),
            id="city_ingestion",
            replace_existing=True,
        )
    scheduler.start()
    logger.info("Scheduler started with interval %d minutes", interval)

def shutdown_scheduler() -> None:
    """Gracefully shut down the APScheduler on FastAPI shutdown."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler shutdown")
    else:
        logger.info("Scheduler was not running")
