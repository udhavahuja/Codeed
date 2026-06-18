# import necessary modules and packages
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import random

from config.db import db, OTP_EXPIRY_MINUTES
from models.user_model import create_user, user_response_schema
from utils.email_service import send_otp_email


user_bp = Blueprint("user_bp", __name__)

# Collections
users = db.users


# ---------------- REGISTER ----------------
@user_bp.route("/register", methods=["POST"])
def register():
    data = request.json

    # Validate input
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    # Check if user already exists
    if users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    # Hash password
    hashed_password = generate_password_hash(password)

    # Create user using model (SCHEMA ENFORCED)
    user_doc = create_user(
        name=name,
        email=email,
        hashed_password=hashed_password
    )

    users.insert_one(user_doc)

    return jsonify({"message": "User registered successfully"}), 201


# ---------------- LOGIN ----------------
@user_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = users.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": user_response_schema(user)
    }), 200


# ---------------- FORGOT PASSWORD ----------------
@user_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = users.find_one({"email": email})

    # Security: do NOT reveal if email exists
    if not user:
        return jsonify({"message": "If email exists, OTP has been sent"}), 200

    otp = str(random.randint(100000, 999999))
    expiry_time = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # Overwrite old OTP (resend logic)
    users.update_one(
        {"email": email},
        {
            "$set": {
                "reset_otp": otp,
                "otp_expiry": expiry_time
            }
        }
    )

    send_otp_email(email, otp)

    return jsonify({
        "message": f"OTP sent to email (valid for {OTP_EXPIRY_MINUTES} minutes)"
    }), 200


# ---------------- RESET PASSWORD ----------------
@user_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.json

    email = data.get("email")
    otp = data.get("otp")
    new_password = data.get("new_password")

    if not email or not otp or not new_password:
        return jsonify({"error": "All fields required"}), 400

    user = users.find_one({"email": email})

    if not user or user.get("reset_otp") != otp:
        return jsonify({"error": "Invalid OTP"}), 400

    if datetime.utcnow() > user.get("otp_expiry"):
        return jsonify({"error": "OTP expired"}), 400

    hashed_password = generate_password_hash(new_password)

    users.update_one(
        {"email": email},
        {
            "$set": {
                "password": hashed_password,
                "updated_at": datetime.utcnow()
            },
            "$unset": {
                "reset_otp": "",
                "otp_expiry": ""
            }
        }
    )

    return jsonify({"message": "Password reset successful"}), 200

def get_user_by_email(email):
    return users.find_one({"email": email})

# ---------------- GET PROFILE ----------------
@user_bp.route("/me", methods=["GET"])
def get_profile():
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "User not identified"}), 401

    user = get_user_by_email(email)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "user": user_response_schema(user)
    }), 200


# ---------------- UPDATE PROFILE ----------------
@user_bp.route("/updateme", methods=["PUT"])
def update_profile():
    email = request.headers.get("X-User-Email")
    data = request.json or {}

    if not email:
        return jsonify({"error": "User not identified"}), 401

    user = get_user_by_email(email)
    if not user:
        return jsonify({"error": "User not found"}), 404

    update_fields = {}

    if "name" in data:
        update_fields["name"] = data["name"]

    if not update_fields:
        return jsonify({"error": "No valid fields to update"}), 400

    users.update_one(
        {"email": email},
        {"$set": update_fields}
    )

    updated_user = get_user_by_email(email)

    return jsonify({
        "message": "Profile updated successfully",
        "user": user_response_schema(updated_user)
    }), 200

# ---------------- GET STREAK ----------------
@user_bp.route("/user/streak", methods=["GET"])
def get_streak():
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "Unauthorized"}), 401

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    streak = user.get("streak", {
        "current": 0,
        "longest": 0,
        "last_activity": None
    })

    return jsonify({
        "current_streak": streak["current"],
        "longest_streak": streak["longest"]
    }), 200

# ---------------- STREAK HISTORY ----------------
@user_bp.route("/user/streak/history", methods=["GET"])
def streak_history():
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "Unauthorized"}), 401

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    streak = user.get("streak", {})
    last_date = streak.get("last_activity")

    today = datetime.utcnow().date()

    days = []
    for i in range(14):   # last 14 days
        day = today - timedelta(days=13 - i)

        days.append({
            "date": day.isoformat(),
            "studied": (
                last_date is not None
                and last_date.date() >= day
                and (today - day).days < streak.get("current", 0)
            )
        })

    return jsonify({"days": days}), 200

# ---------------- STREAK PING ----------------
@user_bp.route("/user/ping", methods=["POST"])
def streak_ping():
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "Unauthorized"}), 401

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    from services.streak_service import update_streak
    update_streak(user, users)

    return jsonify({"message": "Streak updated"}), 200

