from flask import Blueprint, request, jsonify
from datetime import datetime

from config.db import db
from models.focus_session_model import create_focus_session

focus_bp = Blueprint("focus_bp", __name__)

focus_sessions = db.focus_sessions
users = db.users


# ---------------- START FOCUS MODE ----------------
@focus_bp.route("/focus/start", methods=["POST"])
def start_focus():
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "User not identified"}), 401

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Check if already in focus
    active = focus_sessions.find_one({
        "user_id": user["_id"],
        "is_active": True
    })

    if active:
        return jsonify({"error": "Focus session already active"}), 400

    session = create_focus_session(user["_id"])
    focus_sessions.insert_one(session)

    return jsonify({"message": "Focus mode started"}), 200


# ---------------- END FOCUS MODE ----------------
@focus_bp.route("/focus/end", methods=["POST"])
def end_focus():
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "User not identified"}), 401

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    active = focus_sessions.find_one({
        "user_id": user["_id"],
        "is_active": True
    })

    if not active:
        return jsonify({"error": "No active focus session"}), 400

    focus_sessions.update_one(
        {"_id": active["_id"]},
        {"$set": {
            "ended_at": datetime.utcnow(),
            "is_active": False
        }}
    )

    return jsonify({"message": "Focus mode ended"}), 200
