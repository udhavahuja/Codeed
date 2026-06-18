from datetime import datetime

def create_progress(user_id, course_id, topic_id):
    return {
        "user_id": user_id,
        "course_id": course_id,
        "topic_id": topic_id,
        "status": "in_progress",
        "progress_percent": 0,
        "last_accessed": datetime.utcnow()
    }
