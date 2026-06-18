from datetime import datetime

def create_focus_session(user_id):
    return {
        "user_id": user_id,
        "started_at": datetime.utcnow(),
        "ended_at": None,
        "is_active": True
    }
