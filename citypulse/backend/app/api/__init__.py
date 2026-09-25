from fastapi import APIRouter
from .health import router as health_router
from .ingest import router as ingest_router
from .observations import router as observations_router
from .auth import router as auth_router
from .users import router as users_router
from .events import router as events_router
from .alerts import router as alerts_router
from .anomalies import router as anomalies_router
from .correlations import router as correlations_router
from .feedback import router as feedback_router
from .analytics import router as analytics_router
from .providers import router as providers_router
from .models import router as models_router

from .maps import router as maps_router
from .traffic import router as traffic_router
from .transit import router as transit_router
from .weather import router as weather_router

router = APIRouter()
router.include_router(health_router, prefix="/health")
router.include_router(ingest_router, prefix="/ingest")
router.include_router(observations_router, prefix="/observations")
router.include_router(auth_router, prefix="/auth")
router.include_router(users_router, prefix="/users")
router.include_router(events_router, prefix="/events")
router.include_router(alerts_router, prefix="/alerts")
router.include_router(anomalies_router, prefix="/anomalies")
router.include_router(correlations_router, prefix="/correlations")
router.include_router(feedback_router, prefix="/feedback")
router.include_router(analytics_router, prefix="/analytics")
router.include_router(providers_router, prefix="/providers")
router.include_router(models_router, prefix="/models")
router.include_router(maps_router, prefix="/maps")
router.include_router(traffic_router, prefix="/traffic")
router.include_router(transit_router, prefix="/transit")
router.include_router(weather_router, prefix="/weather")
