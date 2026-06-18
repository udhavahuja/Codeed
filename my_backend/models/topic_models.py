from datetime import datetime

def create_topic(course_id, title, teacher_content=""):
    return {
        "course_id": course_id,
        "title": title,
        "teacher_content": teacher_content,
        "created_at": datetime.utcnow()
    }
