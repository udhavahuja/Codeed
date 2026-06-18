from flask import Blueprint, request, jsonify
from bson import ObjectId
from bson.errors import InvalidId
import json

from config.db import db
from models.question_model import create_question
from models.question_attempt_model import create_question_attempt
from services.groq_service import generate_mcq
from services.streak_service import update_streak

mcq_bp = Blueprint("mcq_bp", __name__)
print("MCQ ROUTES LOADED")

questions = db.questions
attempts = db.question_attempts
users = db.users
topics = db.topics


# ---------------- CREATE MCQ (MANUAL / TEACHER) ----------------
@mcq_bp.route("/mcq/create", methods=["POST"])
def create_mcq():
    data = request.json

    required = ["topic_id", "difficulty", "question", "options", "answer"]
    if not data or not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400

    try:
        topic_id = ObjectId(data["topic_id"])
    except InvalidId:
        return jsonify({"error": "Invalid topic_id"}), 400

    if not topics.find_one({"_id": topic_id}):
        return jsonify({"error": "Topic not found"}), 404

    mcq = create_question(
        question_type="mcq",
        topic_id=topic_id,
        difficulty=data["difficulty"],
        content={
            "question": data["question"],
            "options": data["options"],
            "answer": data["answer"]
        },
        generated_by="teacher"
    )

    questions.insert_one(mcq)
    return jsonify({"message": "MCQ created successfully"}), 201


# ---------------- FETCH MCQs BY TOPIC ----------------
@mcq_bp.route("/mcq/<topic_id>", methods=["POST"])
def get_mcqs(topic_id):
    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        topic_id = ObjectId(topic_id)
    except InvalidId:
        return jsonify({"error": "Invalid topic id"}), 400
    
    data = request.get_json() or {}
    difficulty = data.get("difficulty")

    mcqs = list(questions.find({"type": "mcq", "topic_id": topic_id, "difficulty": difficulty}))

    for q in mcqs:
        q["_id"] = str(q["_id"])
        q["topic_id"] = str(q["topic_id"])
        #q["content"].pop("answer", None)  # hide answer

    return jsonify({"mcqs": mcqs}), 200


# ---------------- ATTEMPT MCQ (STREAK HERE) ----------------
@mcq_bp.route("/mcq/attempt", methods=["POST"])
def attempt_mcq():
    data = request.json
    email = request.headers.get("X-User-Email")

    required = ["question_id", "selected_option", "mode"]
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
        return jsonify({"error": "Question not found"}), 404

    correct_answer = question["content"]["answer"]
#temprory
    print("SERVER ANSWER:", repr(correct_answer))
    print("USER SENT:", repr(data["selected_option"]))


    is_correct = data["selected_option"].strip().lower() == str(correct_answer).strip().lower()


    attempt = create_question_attempt(
        user_id=user["_id"],
        question_id=question["_id"],
        question_type="mcq",
        mode=data["mode"],  # normal | focus | pomodoro
        is_correct=is_correct
    )

    attempts.insert_one(attempt)

    # 🔥 STREAK UPDATE (single source of truth)
    user = users.find_one({"email": email})
    update_streak(user, users)

    return jsonify({
        "correct": is_correct
    }), 200

# ---------------- NORMALIZE ANSWER ----------------
def normalize_answer(options, answer):
    answer = str(answer).strip()

    # Already correct
    if answer in ["A", "B", "C", "D"]:
        return answer

    # Cases like: "A)", "B.", "Option C"
    if len(answer) > 0 and answer[0] in ["A", "B", "C", "D"]:
        return answer[0]

    # If AI returned full text match
    for letter, text in options.items():
        if str(answer).lower() == str(text).lower():
            return letter

    # Fallback
    return "A"

# ---------------- AI GENERATE MCQ ----------------
@mcq_bp.route("/mcq/ai-generate", methods=["POST"])
def ai_generate_mcq():
    data = request.json

    required = ["topic_id", "topic_name", "difficulty"]
    if not data or not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400

    try:
        topic_id = ObjectId(data["topic_id"])
    except InvalidId:
        return jsonify({"error": "Invalid topic id"}), 400

    ai_response = generate_mcq(data["topic_name"], data["difficulty"])

    try:
        mcq_data = json.loads(ai_response)
        # --- NORMALIZE ANSWER ---
        if "options" in mcq_data and "answer" in mcq_data:
            mcq_data["answer"] = normalize_answer(mcq_data["options"], mcq_data["answer"])
    except:
        return jsonify({"error": "AI response parsing failed"}), 500
    

    mcq = create_question(
        question_type="mcq",
        topic_id=topic_id,
        difficulty=data["difficulty"],
        content=mcq_data,
        generated_by="ai",
        model="llama-3.1-8b-instant"
    )

    questions.insert_one(mcq)
    return jsonify({"message": "AI MCQ generated"}), 201
