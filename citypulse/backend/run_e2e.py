"""
CityPulse End-to-End Test Suite
Tests the complete workflow from signup through ML feedback loop.
Uses [SUCCESS], [FAIL], [SKIP] markers.
"""
import sys
import time
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"
TIMEOUT = 10

results = {"pass": 0, "fail": 0, "skip": 0}
token = None
headers = {}
user_email = f"e2e_{int(time.time())}@example.com"
alert_id = None
anomaly_id = None
feedback_id = None


def ok(msg):
    results["pass"] += 1
    print(f"[SUCCESS] {msg}")


def fail(msg, detail=""):
    results["fail"] += 1
    print(f"[FAIL] {msg}" + (f" — {detail}" if detail else ""))


def skip(msg):
    results["skip"] += 1
    print(f"[SKIP] {msg}")


def check(condition, success_msg, fail_msg, detail=""):
    if condition:
        ok(success_msg)
    else:
        fail(fail_msg, detail)
    return condition


print("=" * 60)
print("CityPulse E2E Test Suite")
print("=" * 60)

# ─── 1. HEALTH CHECK ────────────────────────────────────────────
print("\n--- Phase 1: Health & Connectivity ---")
try:
    r = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
    check(r.status_code == 200, "Health endpoint reachable", "Health check failed", r.text)
except Exception as e:
    fail("Cannot reach backend", str(e))
    print("\nBackend not running. Aborting.")
    sys.exit(1)

# ─── 2. AUTH ────────────────────────────────────────────────────
print("\n--- Phase 2: Authentication ---")

# Signup
try:
    r = requests.post(f"{BASE_URL}/auth/signup", json={
        "email": user_email, "password": "SecurePass123!", "full_name": "E2E Tester"
    }, timeout=TIMEOUT)
    check(r.status_code == 200, "Signup successful", "Signup failed", r.text)
except Exception as e:
    fail("Signup request error", str(e))

# Duplicate email
try:
    r = requests.post(f"{BASE_URL}/auth/signup", json={
        "email": user_email, "password": "SecurePass123!", "full_name": "E2E Tester"
    }, timeout=TIMEOUT)
    check(r.status_code == 400, "Duplicate email correctly rejected", "Duplicate email not rejected", r.text)
except Exception as e:
    fail("Duplicate email test error", str(e))

# Login
try:
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "email": user_email, "password": "SecurePass123!"
    }, timeout=TIMEOUT)
    if check(r.status_code == 200, "Login successful", "Login failed", r.text):
        token = r.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
except Exception as e:
    fail("Login request error", str(e))

# Invalid credentials
try:
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "email": user_email, "password": "wrongpassword"
    }, timeout=TIMEOUT)
    check(r.status_code == 401, "Invalid credentials correctly rejected", "Invalid credentials accepted", r.text)
except Exception as e:
    fail("Invalid credentials test error", str(e))

# Protected route without token
try:
    r = requests.get(f"{BASE_URL}/auth/me", timeout=TIMEOUT)
    check(r.status_code == 401, "Protected route blocks unauthenticated access", "Protected route accessible without auth", r.text)
except Exception as e:
    fail("Protected route test error", str(e))

# Get current user
if token:
    try:
        r = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=TIMEOUT)
        check(r.status_code == 200, "Get current user (/auth/me)", "Failed to get current user", r.text)
    except Exception as e:
        fail("Get current user error", str(e))

# ─── 3. USER PREFERENCES ─────────────────────────────────────────
print("\n--- Phase 3: User Preferences ---")

if token:
    prefs_payload = {
        "home_city": "Jaipur",
        "home_zone": "Central",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "alert_radius_km": 100.0,
        "alert_preferences": {
            "disaster": True, "weather": True, "air_quality": True,
            "traffic": True, "anomaly": True
        }
    }
    try:
        r = requests.put(f"{BASE_URL}/users/preferences", json=prefs_payload, headers=headers, timeout=TIMEOUT)
        check(r.status_code == 200, "User preferences updated", "Preferences update failed", r.text)
    except Exception as e:
        fail("Preferences update error", str(e))

    try:
        r = requests.get(f"{BASE_URL}/users/preferences", headers=headers, timeout=TIMEOUT)
        if check(r.status_code == 200, "Preferences retrieved", "Preferences retrieval failed", r.text):
            pref = r.json()
            check(pref.get("home_city") == "Jaipur", "Home city persisted correctly", "Home city not persisted")
            check(pref.get("alert_radius_km") == 100.0, "Alert radius persisted correctly", "Alert radius not persisted")
    except Exception as e:
        fail("Preferences retrieval error", str(e))
else:
    skip("Preferences tests (no auth token)")

# ─── 4. CIVIC DATA INGESTION ──────────────────────────────────────
print("\n--- Phase 4: Civic Data Ingestion ---")

try:
    r = requests.post(f"{BASE_URL}/ingest/weather", params={
        "city": "Jaipur", "latitude": 26.9124, "longitude": 75.7873
    }, timeout=15)
    if r.status_code == 201:
        ok("Weather ingestion (Open-Meteo real data)")
    elif r.status_code in (429, 502) and "429" in r.text:
        skip("Weather ingestion rate-limited by Open-Meteo (429) — not a code error")
    else:
        fail("Weather ingestion failed", r.text)
except Exception as e:
    fail("Weather ingestion error", str(e))

try:
    r = requests.post(f"{BASE_URL}/ingest/weather", params={
        "city": "Delhi", "latitude": 28.7041, "longitude": 77.1025
    }, timeout=15)
    if r.status_code == 201:
        ok("Weather ingestion for Delhi")
    elif r.status_code in (429, 502) and ("429" in r.text or "Too Many" in r.text):
        skip("Delhi weather rate-limited by Open-Meteo (429) — not a code error")
    else:
        fail("Delhi weather ingestion failed", r.text)
except Exception as e:
    fail("Delhi weather ingestion error", str(e))

# ─── 5. OBSERVATIONS ────────────────────────────────────────────
print("\n--- Phase 5: Observations ---")

try:
    r = requests.get(f"{BASE_URL}/observations/", timeout=TIMEOUT)
    if check(r.status_code == 200, "Observations list returned", "Observations list failed", r.text):
        obs = r.json()
        check(len(obs) > 0, f"Observations stored ({len(obs)} records)", "No observations found")
        if obs:
            first = obs[0]
            has_required = all(k in first for k in ["id", "city", "timestamp", "source"])
            check(has_required, "Observations have required normalized fields", "Missing normalized fields")
except Exception as e:
    fail("Observations retrieval error", str(e))

try:
    r = requests.get(f"{BASE_URL}/observations/?city=Jaipur", timeout=TIMEOUT)
    check(r.status_code == 200, "City-filtered observations work", "City filter failed", r.text)
except Exception as e:
    fail("Observation city filter error", str(e))

# ─── 6. DISASTER INGESTION + NEARBY ALERT ────────────────────────
print("\n--- Phase 6: Disaster Ingestion + Nearby Alerts ---")

disaster_event_id = None
try:
    r = requests.post(f"{BASE_URL}/ingest/disaster", params={
        "city": "Jaipur", "latitude": 26.9124, "longitude": 75.7873, "force": True
    }, timeout=TIMEOUT)
    if check(r.status_code == 201, "Disaster event ingested (simulated)", "Disaster ingestion failed", r.text):
        data = r.json()
        disaster_event_id = data.get("id")
        check(disaster_event_id is not None, f"Disaster event ID returned ({disaster_event_id})", "No event ID returned")
except Exception as e:
    fail("Disaster ingestion error", str(e))

# ─── 7. EVENTS ──────────────────────────────────────────────────
print("\n--- Phase 7: Events ---")

try:
    r = requests.get(f"{BASE_URL}/events/", timeout=TIMEOUT)
    if check(r.status_code == 200, "Events list returned", "Events list failed", r.text):
        events = r.json()
        check(len(events) > 0, f"Events stored ({len(events)} events)", "No events found")
except Exception as e:
    fail("Events retrieval error", str(e))

# ─── 8. ALERTS ──────────────────────────────────────────────────
print("\n--- Phase 8: Alerts ---")

if token:
    try:
        r = requests.get(f"{BASE_URL}/alerts/", headers=headers, timeout=TIMEOUT)
        if check(r.status_code == 200, "Alerts list returned", "Alerts list failed", r.text):
            alerts = r.json()
            print(f"  Alerts count: {len(alerts)}")
            if alerts:
                alert_id = alerts[0]["id"]
                ok(f"Alert found (ID={alert_id}, severity={alerts[0].get('severity')})")
    except Exception as e:
        fail("Alerts list error", str(e))

    try:
        r = requests.get(f"{BASE_URL}/alerts/unread-count", headers=headers, timeout=TIMEOUT)
        if check(r.status_code == 200, "Unread count endpoint works", "Unread count failed", r.text):
            print(f"  Unread alerts: {r.json().get('unread_count', 0)}")
    except Exception as e:
        fail("Unread count error", str(e))

    if alert_id:
        try:
            r = requests.post(f"{BASE_URL}/alerts/{alert_id}/read", headers=headers, timeout=TIMEOUT)
            check(r.status_code == 200, f"Alert {alert_id} marked as read", "Mark read failed", r.text)
        except Exception as e:
            fail("Mark read error", str(e))
    else:
        skip("Mark alert read (no alert to mark)")
else:
    skip("Alerts tests (no auth token)")

# ─── 9. ANALYTICS ───────────────────────────────────────────────
print("\n--- Phase 9: Analytics ---")

try:
    r = requests.get(f"{BASE_URL}/analytics/summary?city=Jaipur", timeout=TIMEOUT)
    if check(r.status_code == 200, "Analytics summary endpoint works", "Analytics summary failed", r.text):
        data = r.json()
        print(f"  Summary status: {data.get('status')}")
        print(f"  Obs count: {data.get('observation_count', 0)}")
        if data.get("status") == "insufficient_data":
            ok("Analytics correctly reports insufficient data (not enough observations yet)")
        else:
            ok(f"Analytics summary generated: {data.get('summary', '')[:100]}")
except Exception as e:
    fail("Analytics summary error", str(e))

try:
    r = requests.get(f"{BASE_URL}/analytics/civic-pulse?city=Jaipur", timeout=TIMEOUT)
    if check(r.status_code == 200, "Civic pulse endpoint works", "Civic pulse failed", r.text):
        pulse = r.json()
        check("dimensions" in pulse, "Civic pulse has dimensions", "Civic pulse missing dimensions")
        print(f"  Pulse status: {pulse.get('status')}")
except Exception as e:
    fail("Civic pulse error", str(e))

try:
    r = requests.get(f"{BASE_URL}/analytics/trends?city=Jaipur", timeout=TIMEOUT)
    check(r.status_code == 200, "Analytics trends endpoint works", "Trends endpoint failed", r.text)
except Exception as e:
    fail("Analytics trends error", str(e))

# ─── 10. ANOMALY DETECTION ───────────────────────────────────────
print("\n--- Phase 10: Anomaly Detection ---")

try:
    r = requests.post(f"{BASE_URL}/analytics/detect-anomalies?city=Jaipur", timeout=TIMEOUT)
    if check(r.status_code == 200, "Anomaly detection endpoint works", "Anomaly detection failed", r.text):
        data = r.json()
        results_list = data.get("results", [])
        if results_list and results_list[0].get("status") == "insufficient_data":
            ok("Anomaly detection correctly reports insufficient data (expected with few observations)")
        elif results_list:
            ok(f"Anomaly detection ran. Results: {len(results_list)}")
except Exception as e:
    fail("Anomaly detection error", str(e))

try:
    r = requests.get(f"{BASE_URL}/anomalies/?city=Jaipur", timeout=TIMEOUT)
    check(r.status_code == 200, "Anomalies list endpoint works", "Anomalies list failed", r.text)
except Exception as e:
    fail("Anomalies list error", str(e))

# ─── 11. CORRELATION ─────────────────────────────────────────────
print("\n--- Phase 11: Correlation ---")

try:
    r = requests.post(f"{BASE_URL}/analytics/compute-correlations?city=Jaipur", timeout=TIMEOUT)
    if check(r.status_code == 200, "Correlation computation endpoint works", "Correlation failed", r.text):
        data = r.json()
        results_list = data.get("results", [])
        if results_list and results_list[0].get("status") == "insufficient_data":
            ok("Correlation correctly reports insufficient data (expected — need 10+ paired observations)")
        else:
            ok(f"Correlation computed. Results: {len(results_list)}")
except Exception as e:
    fail("Correlation error", str(e))

try:
    r = requests.get(f"{BASE_URL}/correlations/?city=Jaipur", timeout=TIMEOUT)
    check(r.status_code == 200, "Correlations list endpoint works", "Correlations list failed", r.text)
except Exception as e:
    fail("Correlations list error", str(e))

# ─── 12. FEEDBACK ─────────────────────────────────────────────────
print("\n--- Phase 12: Feedback Submission ---")

if token:
    feedback_payload = {
        "alert_id": alert_id,
        "feedback_type": "alert_usefulness",
        "predicted_severity": "HIGH",
        "actual_severity": "MEDIUM",
        "observed_features": {
            "aqi": 185,
            "pm25": 92.0,
            "temperature_c": 34.2,
            "traffic_delay_min": 18
        },
        "user_comment": "The alert was triggered but severity seemed a bit high."
    }
    try:
        r = requests.post(f"{BASE_URL}/feedback/", json=feedback_payload, headers=headers, timeout=TIMEOUT)
        if check(r.status_code == 200, "Feedback submitted", "Feedback submission failed", r.text):
            feedback_id = r.json().get("id")
            ok(f"Feedback stored with ID={feedback_id}, status={r.json().get('validation_status')}")
    except Exception as e:
        fail("Feedback submission error", str(e))
else:
    skip("Feedback tests (no auth token)")

# ─── 13. FEEDBACK VALIDATION ─────────────────────────────────────
print("\n--- Phase 13: Feedback Validation ---")

if token and feedback_id:
    try:
        r = requests.post(
            f"{BASE_URL}/feedback/{feedback_id}/validate",
            params={"status": "VALIDATED"},
            headers=headers,
            timeout=TIMEOUT
        )
        if check(r.status_code == 200, "Feedback validated", "Feedback validation failed", r.text):
            check(r.json().get("validation_status") == "VALIDATED", "Validation status updated to VALIDATED", "Status not updated")
    except Exception as e:
        fail("Feedback validation error", str(e))
else:
    skip("Feedback validation (no feedback ID or token)")

# ─── 14. MODEL TRAINING ───────────────────────────────────────────
print("\n--- Phase 14: Model Training ---")

try:
    r = requests.post(f"{BASE_URL}/models/train", timeout=TIMEOUT)
    if r.status_code == 400 and "Not enough validated feedback" in r.text:
        ok("Model training correctly reports insufficient validated feedback")
    elif r.status_code == 200:
        ok(f"Model trained: {r.json().get('version')}")
    else:
        fail("Model training returned unexpected status", f"{r.status_code}: {r.text}")
except Exception as e:
    fail("Model training error", str(e))

try:
    r = requests.get(f"{BASE_URL}/models/", timeout=TIMEOUT)
    check(r.status_code == 200, "Model list endpoint works", "Model list failed", r.text)
except Exception as e:
    fail("Model list error", str(e))

# ─── 15. DATA SOURCES / PROVIDERS ────────────────────────────────
print("\n--- Phase 15: Data Sources ---")

try:
    r = requests.get(f"{BASE_URL}/providers/", timeout=TIMEOUT)
    if check(r.status_code == 200, "Providers list works", "Providers list failed", r.text):
        providers = r.json()
        simulated = [p for p in providers if p.get("is_simulated")]
        real = [p for p in providers if not p.get("is_simulated")]
        ok(f"Providers: {len(real)} real, {len(simulated)} simulated")
except Exception as e:
    fail("Providers list error", str(e))

# ─── SUMMARY ─────────────────────────────────────────────────────
print("\n" + "=" * 60)
print(f"E2E RESULTS: {results['pass']} passed / {results['fail']} failed / {results['skip']} skipped")
if results["fail"] == 0:
    print("ALL TESTS PASSED")
else:
    print(f"FAILURES: {results['fail']} test(s) failed")
print("=" * 60)

sys.exit(0 if results["fail"] == 0 else 1)
