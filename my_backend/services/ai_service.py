from config.db import db
from models.ai_message_model import create_ai_message
from groq import Groq
from bson import ObjectId

ai_messages = db.ai_messages

# initialize groq client
client = Groq()

systemPrompt = '''You are a helpful Python tutor for beginners. Give on point answer to the question asked. 
Keep the answer concise and easy to understand. Give a short code snippet if required.
If the question is not related to Python programming, politely inform the user that you can only assist with Python programming questions.
At the end ask if they need a practice question and give it accordingly.
'''

def ask_ai_service(user_id, question):
    # 1️⃣ call Groq
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",   # or whichever you used earlier
        messages=[
            {"role": "system", "content": systemPrompt},
            {"role": "user", "content": question}
        ]
    )

    answer = response.choices[0].message.content

    # 2️⃣ save to DB
    doc = create_ai_message(
        ObjectId(user_id),
        question,
        answer
    )

    ai_messages.insert_one(doc)

    return {
        "question": question,
        "answer": answer
    }


def get_ai_history_service(user_id):
    history = list(ai_messages.find(
        {"user_id": ObjectId(user_id)}
    ).sort("created_at", -1))

    return [
        {
            "question": h["question"],
            "answer": h["answer"]
        }
        for h in history
    ]
