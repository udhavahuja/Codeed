from config.db import db
from models.ai_message_model import create_ai_message
from groq import Groq
from bson import ObjectId

ai_messages = db.ai_messages

# initialize groq client
client = Groq()

systemPrompt = '''You are a Python tutor for beginners. You are given coding question and answer below. Check if the code is correct or not.
If the code is correct, respond with "The code is correct.". Else, tell the user what is wrong with the code and provide the corrected code.
Keep the answer concise and easy to understand. Give a short code snippet if required.
'''

def check_code(user_id, qna):
    # 1️⃣ call Groq
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",   # or whichever you used earlier
        messages=[
            {"role": "system", "content": systemPrompt},
            {"role": "user", "content": qna}
        ]
    )

    answer = response.choices[0].message.content

    return {
        "question": qna,
        "answer": answer
    }

