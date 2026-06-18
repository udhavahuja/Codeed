from flask import Blueprint, request, jsonify
from datetime import datetime

from config.db import db
from models.pomodoro_session_model import create_pomodoro_session

pomodoro_bp = Blueprint("pomodoro_bp", __name__)

pomodoro_sessions = db.pomodoro_sessions
users = db.users


# ---------------- START POMODORO ----------------
@pomodoro_bp.route("/pomodoro/start", methods=["POST"])
def start_pomodoro():
    email = request.headers.get("X-User-Email")
    data = request.json

    if not email:
        return jsonify({"error": "User not identified"}), 401

    duration = data.get("duration_minutes", 25)

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Prevent multiple active pomodoros
    active = pomodoro_sessions.find_one({
        "user_id": user["_id"],
        "is_active": True
    })

    if active:
        return jsonify({"error": "Pomodoro already active"}), 400

    session = create_pomodoro_session(
        user_id=user["_id"],
        duration_minutes=duration
    )

    pomodoro_sessions.insert_one(session)

    return jsonify({
        "message": "Pomodoro started",
        "duration_minutes": duration
    }), 200


# ----------------- END POMODORO -----------------
@pomodoro_bp.route("/pomodoro/end", methods=["POST"])
def end_pomodoro():
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "User not identified"}), 401

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    active = pomodoro_sessions.find_one({
        "user_id": user["_id"],
        "is_active": True
    })

    if not active:
        return jsonify({"error": "No active pomodoro"}), 400

    pomodoro_sessions.update_one(
        {"_id": active["_id"]},
        {"$set": {
            "ended_at": datetime.utcnow(),
            "is_active": False,
            "completed": True
        }}
    )

    return jsonify({"message": "Pomodoro completed"}), 200