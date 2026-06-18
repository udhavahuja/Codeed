from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId

from config.db import db
from models.question_model import create_question
from models.question_attempt_model import create_question_attempt
from services.groq_service import generate_coding_question
from services.streak_service import update_streak

coding_bp = Blueprint("coding_bp", __name__)

questions = db.questions
attempts = db.question_attempts
users = db.users
topics = db.topics


# ---------------- AI GENERATE CODING QUESTION ----------------
@coding_bp.route("/coding/ai-generate", methods=["POST"])
def ai_generate_coding():
    data = request.json

    required = ["topic_id", "topic_name", "difficulty"]
    if not data or not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400

    try:
        topic_id = ObjectId(data["topic_id"])
    except InvalidId:
        return jsonify({"error": "Invalid topic id"}), 400

    coding_data = generate_coding_question(
        data["topic_name"],
        data["difficulty"]
    )

    coding_question = create_question(
        question_type="coding",
        topic_id=topic_id,
        difficulty=data["difficulty"],
        content=coding_data,
        generated_by="ai",
        model="llama-3.1-8b-instant"
    )

    questions.insert_one(coding_question)
    return jsonify({"message": "Coding question generated"}), 201


# ---------------- FETCH CODING QUESTIONS ----------------
@coding_bp.route("/coding/<topic_id>", methods=["POST"])
def get_coding_questions(topic_id):
    from bson import ObjectId, errors as bson_errors
    try:
        topic_id = ObjectId(topic_id)
    except bson_errors.InvalidId:
        return jsonify({"error": "Invalid topic id"}), 400
    
    data = request.get_json() or {}
    difficulty = data.get("difficulty")

    coding_questions = list(
        questions.find({
            "type": "coding",
            "topic_id": topic_id,
            "difficulty": difficulty
        })
    )

    for q in coding_questions:
        q["_id"] = str(q["_id"])
        q["topic_id"] = str(q["topic_id"])
    

        # ❌ DO NOT send solution to frontend
        if "solution" in q["content"]:
            q["content"].pop("solution")

    return jsonify({"coding_questions": coding_questions}), 200


# ---------------- ATTEMPT CODING QUESTION (STREAK) ----------------
@coding_bp.route("/coding/attempt", methods=["POST"])
def attempt_coding():
    data = request.json
    email = request.headers.get("X-User-Email")

    required = ["question_id", "mode"]
    if not email or not data or not all(k in data for k in required):
        return jsonify({"error": "Invalid request"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        question_id = ObjectId(data["question_id"])
    except InvalidId:
        return jsonify({"error": "Invalid question id"}), 400

    question = questions.find_one({"_id": question_id})
    if not question:
        return jsonify({"error": "Question not found"}), 404

    attempt = create_question_attempt(
        user_id=user["_id"],
        question_id=question["_id"],
        question_type="coding",
        mode=data["mode"],   # normal | focus | pomodoro
        is_correct=True      # attempt = streak increment
    )

    attempts.insert_one(attempt)

    # 🔥 UPDATE STREAK
    user = users.find_one({"email": email})
    update_streak(user, users)

    return jsonify({"message": "Coding question attempted"}), 200