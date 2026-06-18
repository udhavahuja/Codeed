import os
from flask import Flask
from flask_cors import CORS

# ---- Blueprints ----
from routes.user_routes import user_bp
from routes.course_routes import course_bp
from routes.focus_routes import focus_bp
from routes.pomodoro_routes import pomodoro_bp
from routes.mcq_routes import mcq_bp
from routes.flashcard_routes import flashcard_bp
from routes.coding_routes import coding_bp
from routes.community_routes import community_bp
from routes.ai_routes import ai_bp

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "X-User-Email"],
    methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"]
)

# ---- Register Blueprints ----
app.register_blueprint(user_bp)
app.register_blueprint(course_bp)
app.register_blueprint(focus_bp)
app.register_blueprint(pomodoro_bp)
app.register_blueprint(mcq_bp)
app.register_blueprint(flashcard_bp)
app.register_blueprint(coding_bp)
app.register_blueprint(community_bp)
app.register_blueprint(ai_bp)


@app.route("/")
def home():
    return "Backend API running 🚀"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
    