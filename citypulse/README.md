# CityPulse — Real-Time Environmental Intelligence Platform

CityPulse is a professional real-data environmental intelligence SaaS platform providing live weather and air quality monitoring, geospatial mapping, analytics, and automated data ingestion for smart cities.

---

## 1. Project Overview
CityPulse provides local citizens and officials with live telemetry about their city's environment. It actively scans for disasters and statistical anomalies, pushing alerts to affected users.

## 2. Key Features
- **Real-Time Dashboards**: Premium dark-mode UI with live civic pulse metrics.
- **Geospatial Mapping**: MapLibre integration showing live anomalies, alerts, and active events.
- **Automated Ingestion**: Background tasks pulling real data from Open-Meteo and OpenAQ.
- **Anomaly Detection**: Statistical Z-score and rolling-mean analysis.
- **Feedback Loop**: Users can validate alerts and provide local ground-truth data.

## 3. Technology Stack
- **Backend**: FastAPI (Python), SQLAlchemy 2.0 (AsyncIO), Alembic
- **Database**: PostgreSQL (fallback to SQLite `citypulse.db`)
- **Frontend**: React 19, TypeScript, Vite, React Router v6
- **UI & Visualization**: Vanilla CSS (Deep Navy), MapLibre GL JS, Recharts

## 4. System Architecture
The application uses a layered architecture:
`API Routers -> Services (Business Logic) -> Repositories (Data Access) -> ORM`

## 5. Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (optional, defaults to SQLite)

## 6. Backend Installation
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## 7. Frontend Installation
```bash
cd frontend
npm install
```

## 8. Environment Variables
Create `.env` in the project root:
```ini
DATABASE_URL=postgresql+asyncpg://citypulse:password@localhost:5432/citypulse
INGESTION_CITIES=Jaipur,Delhi,Mumbai,London,New York
INGESTION_INTERVAL_MINUTES=30
```

## 9. Database Migrations
Initialize the SQLite/PostgreSQL schema:
```bash
cd backend
python -m alembic upgrade head
```

## 10. Running the Application
**Backend:**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
**Frontend:**
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 3000
```

## 11. API Documentation
Swagger UI is automatically available at:
`http://127.0.0.1:8000/docs`

## 12. Authentication
JWT-based authentication using `pbkdf2_sha256` password hashing. Users can sign up and login via the `/api/v1/auth/` routes.

## 13. End-to-End Testing
A comprehensive 15-phase Python test script is provided:
```bash
cd backend
python run_e2e.py
```
This tests signup, preferences, ingestion, alerts, and feedback.

## 14. ML Feedback Loop
Alerts generate feedback forms. Validated feedback (`status=VALIDATED`) trains the anomaly models via `POST /models/train`.

## 15. Troubleshooting
- **No data on map?** Ensure backend is running and trigger `/ingest/weather` or `/ingest/disaster` manually.
- **Port 8000 in use?** Change the uvicorn port and update `VITE_API_BASE_URL` in the frontend.
