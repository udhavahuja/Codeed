from datetime import datetime


def create_question_attempt(
    user_id,
    question_id,
    question_type,
    mode,
    is_correct=None
):
    """
    Records ONE attempt of ANY question type.
    This is the SINGLE source of truth for streaks.
    """
    return {
        "user_id": user_id,                 # ObjectId (users)
        "question_id": question_id,         # ObjectId (questions)
        "question_type": question_type,     # "mcq" | "flashcard" | "coding"
        "mode": mode,                       # "normal" | "focus" | "pomodoro"
        "is_correct": is_correct,
        "attempted_at": datetime.utcnow()
    }
