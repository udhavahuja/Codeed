from flask import Blueprint, request, jsonify
from services.community_service import (
    ask_question_service,
    answer_question_service,
    get_course_feed_service
)

community_bp = Blueprint("community", __name__)


@community_bp.route("/community/<course_id>/feed", methods=["GET"])
def get_feed(course_id):
    try:
        feed = get_course_feed_service(course_id)
        return jsonify({"feed": feed}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Something went wrong"}), 500


@community_bp.route("/community/question", methods=["POST"])
def ask_question():
    data = request.json
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "Not authenticated"}), 401

    course_id = data.get("course_id")
    question = data.get("question")

    if not course_id or not question:
        return jsonify({"error": "Missing fields"}), 400

    try:
        res = ask_question_service(email, course_id, question)
        return jsonify(res), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@community_bp.route("/community/answer", methods=["POST"])
def answer_question():
    data = request.json
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "Not authenticated"}), 401

    question_id = data.get("question_id")
    answer = data.get("answer")

    if not question_id or not answer:
        return jsonify({"error": "Missing fields"}), 400

    try:
        res = answer_question_service(email, question_id, answer)
        return jsonify(res), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
