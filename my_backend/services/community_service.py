from bson import ObjectId
from config.db import db
from models.community_question_model import create_question
from models.community_answer_model import create_answer

users = db.users
courses = db.courses
progress = db.progress
community_questions = db.community_questions
community_answers = db.community_answers
user_courses = db.user_courses      # 👈 IMPORTANT

# 1️⃣ ask question
def ask_question_service(email, course_id, text):
    user = users.find_one({"email": email})
    if not user:
        raise ValueError("User not found")

    # ✅ CHECK ENROLLMENT CORRECTLY
    enrolled = user_courses.find_one({
        "user_id": user["_id"],
        "course_id": ObjectId(course_id)
    })

    if not enrolled:
        raise ValueError("User not enrolled in this course")

    q = create_question(ObjectId(course_id), user["_id"], text)

    return {
        "id": str(q["_id"]),
        "question": q["question"]
    }


# 2️⃣ answer question
def answer_question_service(email, question_id, text):
    user = users.find_one({"email": email})
    if not user:
        raise ValueError("User not found")

    question = community_questions.find_one({"_id": ObjectId(question_id)})
    if not question:
        raise ValueError("Question not found")

    a = create_answer(ObjectId(question_id), user["_id"], text)

    return {"id": str(a["_id"])}


# 3️⃣ get community feed
def get_course_feed_service(course_id):
    feed = []

    questions = list(
        community_questions.find({
            "course_id": ObjectId(course_id)
        }).sort("created_at", -1)
    )

    for q in questions:
        answers = list(
            community_answers.find({"question_id": q["_id"]})
        )

        feed.append({
            "id": str(q["_id"]),
            "question": q["question"],
            "answers": [
                {
                    "id": str(a["_id"]),
                    "answer": a["answer"]
                }
                for a in answers
            ]
        })

    return feed
