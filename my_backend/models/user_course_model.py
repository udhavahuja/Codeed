from datetime import datetime

def create_user_course(user_id, course_id):
    return {
        "user_id": user_id,
        "course_id": course_id,
        "enrolled_at": datetime.utcnow()
    }