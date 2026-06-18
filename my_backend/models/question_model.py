from datetime import datetime


def create_question(
    question_type,
    topic_id,
    difficulty,
    content,
    generated_by="teacher",
    model=None,
    prompt_hash=None
):
    """
    Base schema for ALL question types:
    mcq | flashcard | coding
    """
    return {
        "type": question_type,            # "mcq" | "flashcard" | "coding"
        "topic_id": topic_id,              # ObjectId (topics collection)
        "difficulty": difficulty,           # "easy" | "medium" | "hard"
        "content": content,                 # type-specific payload
        "generated_by": generated_by,       # "ai" | "teacher"
        "model": model,                     # e.g. "groq-llama3" (optional)
        "prompt_hash": prompt_hash,         # for AI caching (optional)
        "created_at": datetime.utcnow()
    }
