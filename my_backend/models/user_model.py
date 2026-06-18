from datetime import datetime

# 1️⃣ CREATE USER (for DB insertion)
def create_user(name, email, hashed_password):
    return {
        "name": name,
        "email": email,
        "password": hashed_password,

        "profile": {
            "avatar": None,
            "bio": "",
            "joined_at": datetime.utcnow()
        },

        "preferences": {
            "theme": "dark",
            "notifications": True
        },

        "streak": {
            "current": 0,
            "longest": 0,
            "last_active": None
        },

        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }


# 2️⃣ USER RESPONSE SCHEMA (safe for frontend)
def user_response_schema(user):
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "profile": user.get("profile", {}),
        "preferences": user.get("preferences", {}),
        "streaks": user.get("streaks", {})
    }
