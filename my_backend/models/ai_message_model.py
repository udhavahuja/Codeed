from datetime import datetime

def create_ai_message(user_id, question, answer):
    return {
        "user_id": user_id,
        "question": question,
        "answer": answer,
        "created_at": datetime.utcnow()
    }