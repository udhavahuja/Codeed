from datetime import datetime, timedelta

def update_streak(user, users_collection):
    today = datetime.utcnow().date()
    streak = user.get("streak", {})

    last_activity = streak.get("last_activity")
    current = streak.get("current", 0)
    longest = streak.get("longest", 0)

    if last_activity:
        last_date = last_activity.date()

        if last_date == today:
            # already counted today
            return

        elif last_date == today - timedelta(days=1):
            current += 1
        else:
            current = 1
    else:
        current = 1

    longest = max(longest, current)

    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "streak.current": current,
            "streak.longest": longest,
            "streak.last_activity": datetime.utcnow()
        }}
    )