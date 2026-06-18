from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from config.db import db

from models.user_course_model import create_user_course
from models.progress_model import create_progress

course_bp = Blueprint("course_bp", __name__)

# Collections
courses = db.courses
topics = db.topics
progress = db.progress
users = db.users
user_courses = db.user_courses

# -------- 5.2.1 GET /courses --------
@course_bp.route("/courses", methods=["GET"])
def get_courses():
    course_list = list(courses.find())
    for c in course_list:
        c["_id"] = str(c["_id"])
    return jsonify({"courses": course_list}), 200


# -------- 5.2.2 GET /courses/<course_id>/topics --------
@course_bp.route("/courses/<course_id>/topics", methods=["GET"])
def get_topics(course_id):
    topic_list = list(topics.find({"course_id": ObjectId(course_id)}))
    for t in topic_list:
        t["_id"] = str(t["_id"])
        t["course_id"] = str(t["course_id"])
    return jsonify({"topics": topic_list}), 200


# -------- 5.2.3 POST /progress/start --------
@course_bp.route("/progress/start", methods=["POST"])
def start_progress():
    data = request.json
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "User not identified"}), 401

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    course_id = data.get("course_id")
    topic_id = data.get("topic_id")

    if not course_id or not topic_id:
        return jsonify({"error": "Course and topic required"}), 400

    existing = progress.find_one({
        "user_id": user["_id"],
        "topic_id": ObjectId(topic_id)
    })

    if existing:
        return jsonify({"message": "Progress already exists"}), 200

    progress_doc = create_progress(
        user["_id"],
        ObjectId(course_id),
        ObjectId(topic_id)
    )

    progress.insert_one(progress_doc)
    return jsonify({"message": "Progress started"}), 201


# -------- 5.2.4 GET /progress/current --------
@course_bp.route("/progress/current", methods=["GET"])
def current_progress():
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "User not identified"}), 401

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    p = progress.find_one(
        {"user_id": user["_id"]},
        sort=[("last_accessed", -1)]
    )

    if not p:
        return jsonify({"message": "No active progress"}), 200

    p["_id"] = str(p["_id"])
    p["course_id"] = str(p["course_id"])
    p["topic_id"] = str(p["topic_id"])

    return jsonify({"progress": p}), 200


# -------- 5.2.5 PUT /progress/update --------
@course_bp.route("/progress/update", methods=["PUT"])
def update_progress():
    data = request.json
    email = request.headers.get("X-User-Email")

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    topic_id = data.get("topic_id")
    progress_percent = data.get("progress_percent")

    if topic_id is None or progress_percent is None:
        return jsonify({"error": "Invalid data"}), 400

    progress.update_one(
        {
            "user_id": user["_id"],
            "topic_id": ObjectId(topic_id)
        },
        {
            "$set": {
                "progress_percent": progress_percent,
                "last_accessed": datetime.utcnow()
            }
        }
    )

    return jsonify({"message": "Progress updated"}), 200

# -------- 5.2.6 POST /courses/enroll --------
@course_bp.route("/courses/enroll", methods=["POST"])
def enroll_course():
    data = request.json
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "User not identified"}), 401

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    course_id = data.get("course_id")

    if not course_id:
        return jsonify({"error": "Course ID required"}), 400

    # Already enrolled?
    existing = user_courses.find_one({
        "user_id": user["_id"],
        "course_id": ObjectId(course_id)
    })

    if existing:
        return jsonify({"message": "Already enrolled"}), 200

    doc = create_user_course(
        user["_id"],
        ObjectId(course_id)
    )

    user_courses.insert_one(doc)

    return jsonify({"message": "Enrolled successfully"}), 201
