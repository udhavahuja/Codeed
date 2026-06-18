from datetime import datetime
from config.db import db

community_answers = db.community_answers

def create_answer(question_id, user_id, text):
    doc = {
        "question_id": question_id,
        "user_id": user_id,
        "answer": text,
        "created_at": datetime.utcnow()
    }
    result = community_answers.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc