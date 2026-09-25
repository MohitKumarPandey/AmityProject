from fastapi import FastAPI
from .api import router as api_router
from .scheduler import start_scheduler, shutdown_scheduler

app = FastAPI(title="CityPulse API", version="0.1.0")

# CORS configuration for local development
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def root_health():
    return {"status": "ok"}

@app.on_event("startup")
async def on_startup() -> None:
    """Start the APScheduler when the FastAPI app starts."""
    start_scheduler(app)

@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Gracefully shutdown the APScheduler on app termination."""
    shutdown_scheduler()
