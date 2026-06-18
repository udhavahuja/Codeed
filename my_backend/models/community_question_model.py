from datetime import datetime
from config.db import db

community_questions = db.community_questions

def create_question(course_id, user_id, text):
    doc = {
        "course_id": course_id,
        "user_id": user_id,
        "question": text,
        "created_at": datetime.utcnow()
    }
    result = community_questions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc