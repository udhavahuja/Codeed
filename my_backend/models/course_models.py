from datetime import datetime

def create_course(language, description):
    return {
        "language": language,
        "description": description,
        "created_at": datetime.utcnow()
    }
