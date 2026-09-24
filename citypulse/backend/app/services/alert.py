import math
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.event import CivicEventORM, AlertSchema
from ..models.user import UserPreferenceORM
from ..repository.event import persist_alert

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth radius in kilometers
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

async def generate_nearby_alerts(db: AsyncSession, event: CivicEventORM):
    """
    Finds all users whose configured alert_radius_km overlaps with the event distance,
    or if the event's radius_km covers the user's distance.
    Creates an AlertORM for each matching user.
    """
    # Get all users with coordinates
    result = await db.execute(select(UserPreferenceORM).where(UserPreferenceORM.latitude.isnot(None), UserPreferenceORM.longitude.isnot(None)))
    user_prefs = result.scalars().all()
    
    for pref in user_prefs:
        distance = haversine_distance(pref.latitude, pref.longitude, event.latitude, event.longitude)
        
        # Check if event affects user
        if distance <= pref.alert_radius_km or distance <= event.radius_km:
            # Generate alert
            message = (f"{event.severity.capitalize()} {event.event_type.replace('_', ' ').lower()} event "
                       f"reported approximately {int(distance)} km from your selected location. "
                       "Your configured alert radius includes this event. "
                       "This may affect your area.")
                       
            alert = AlertSchema(
                user_id=pref.user_id,
                event_id=event.id,
                alert_type="NEARBY_DISASTER",
                title=f"⚠ {event.severity.capitalize()} {event.event_type.replace('_', ' ').title()} Alert Nearby",
                message=message,
                severity=event.severity,
                source_city=event.city,
                target_city=pref.home_city,
                distance_km=distance,
                created_at=datetime.utcnow(),
                is_read=False
            )
            await persist_alert(db, alert)
