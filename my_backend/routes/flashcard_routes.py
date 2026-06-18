from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId

from config.db import db
from models.question_model import create_question
from models.question_attempt_model import create_question_attempt
from services.groq_service import generate_flashcard
from services.streak_service import update_streak

flashcard_bp = Blueprint("flashcard_bp", __name__)

questions = db.questions
attempts = db.question_attempts
users = db.users
topics = db.topics


# ---------------- AI GENERATE FLASHCARD ----------------
@flashcard_bp.route("/flashcard/ai-generate", methods=["POST"])
def ai_generate_flashcard():
    data = request.json

    required = ["topic_id", "topic_name", "difficulty"]
    if not data or not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400

    try:
        topic_id = ObjectId(data["topic_id"])
    except InvalidId:
        return jsonify({"error": "Invalid topic id"}), 400

    flashcard_data = generate_flashcard(data["topic_name"], data["difficulty"])

    flashcard = create_question(
        question_type="flashcard",
        topic_id=topic_id,
        difficulty= data["difficulty"],  # flashcards don’t really need difficulty
        content=flashcard_data,
        generated_by="ai",
        model="llama-3.1-8b-instant"
    )

    questions.insert_one(flashcard)
    return jsonify({"message": "Flashcard generated"}), 201


# ---------------- FETCH FLASHCARDS ----------------
@flashcard_bp.route("/flashcard/<topic_id>", methods=["POST"])
def get_flashcards(topic_id):
    from bson import ObjectId, errors as bson_errors
    try:
        topic_id = ObjectId(topic_id)
    except bson_errors.InvalidId:
        return jsonify({"error": "Invalid topic id"}), 400
    
    data = request.get_json() or {}
    difficulty = data.get("difficulty")

    flashcards = list(
        questions.find({
            "type": "flashcard",
            "topic_id": topic_id,
            "difficulty": difficulty
        })
    )

    for f in flashcards:
        f["_id"] = str(f["_id"])
        f["topic_id"] = str(f["topic_id"])

    return jsonify({"flashcards": flashcards}), 200


# ---------------- ATTEMPT FLASHCARD (STREAK) ----------------
@flashcard_bp.route("/flashcard/attempt", methods=["POST"])
def attempt_flashcard():
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
        return jsonify({"error": "Invalid question_id"}), 400

    question = questions.find_one({"_id": question_id})
    if not question:
        return jsonify({"error": "Flashcard not found"}), 404

    attempt = create_question_attempt(
        user_id=user["_id"],
        question_id=question["_id"],
        question_type="flashcard",
        mode=data["mode"],   # normal | focus | pomodoro
        is_correct=True      # flashcards are always “attempted”
    )

    attempts.insert_one(attempt)

    # 🔥 STREAK UPDATE
    user = users.find_one({"email": email})
    update_streak(user, users)

    return jsonify({"message": "Flashcard attempted"}), 200
