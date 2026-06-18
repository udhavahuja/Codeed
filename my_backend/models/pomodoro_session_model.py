from datetime import datetime

def create_pomodoro_session(user_id, duration_minutes):
    return {
        "user_id": user_id,
        "duration_minutes": duration_minutes,
        "started_at": datetime.utcnow(),
        "ended_at": None,
        "is_active": True,
        "completed": False
    }
