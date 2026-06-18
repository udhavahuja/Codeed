from config.db import db
from models.ai_message_model import create_ai_message
from groq import Groq
from bson import ObjectId

ai_messages = db.ai_messages

# initialize groq client
client = Groq()

systemPrompt = '''You are a Python expert and a tutor for beginners. You are given acode below. You have to explain the code line by line 
in simple terms that a beginner can understand. explain like I'm 10. Keep the answer very concise and easy to understand. 
Dont put "*" or "`"while explaining the code.
Here is the code:

'''

def explain_code(user_id, code):
    # 1️⃣ call Groq
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",   # or whichever you used earlier
        messages=[
            {"role": "system", "content": systemPrompt},
            {"role": "user", "content": code}
        ]
    )

    answer = response.choices[0].message.content

    return {
        "question": code,
        "answer": answer
    }

