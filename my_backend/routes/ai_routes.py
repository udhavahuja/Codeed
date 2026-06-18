from flask import Blueprint, request, jsonify
from services.ai_service import ask_ai_service, get_ai_history_service
from services.ai_code_checker import check_code
from services.ai_code_explain import explain_code
ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/ai/ask", methods=["POST"])
def ask_ai():
    data = request.json
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "Not authenticated"}), 401

    question = data.get("question")

    if not question:
        return jsonify({"error": "Question required"}), 400

    try:
        user = request.user   # if you have middleware later
    except:
        from config.db import db
        users = db.users
        user = users.find_one({"email": email})

    res = ask_ai_service(user["_id"], question)

    return jsonify(res), 200


@ai_bp.route("/ai/history", methods=["GET"])
def history():
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "Not authenticated"}), 401

    from config.db import db
    users = db.users

    user = users.find_one({"email": email})

    res = get_ai_history_service(user["_id"])

    return jsonify({"history": res}), 200

@ai_bp.route("/ai/check-code", methods=["POST"])
def check_code_route():
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "Not authenticated"}), 401

    from config.db import db
    users = db.users

    user = users.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    qna = data.get("qna")

    if not qna:
        return jsonify({"error": "qna is required"}), 400

    res = check_code(user["_id"], qna)

    return jsonify(res), 200

@ai_bp.route("/ai/explain-code", methods=["POST"])
def explain_code_route():
    email = request.headers.get("X-User-Email")

    if not email:
        return jsonify({"error": "Not authenticated"}), 401

    from config.db import db
    users = db.users

    user = users.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    code = data.get("code")

    if not code:
        return jsonify({"error": "code is required"}), 400

    res = explain_code(user["_id"], code)

    return jsonify(res), 200