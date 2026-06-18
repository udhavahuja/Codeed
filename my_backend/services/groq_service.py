import os
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_mcq(topic, difficulty):
    prompt = f"""
Generate ONE multiple choice question on the topic "{topic}"
Difficulty: {difficulty}

Return JSON ONLY in this format:
{{
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "answer": "A"
}}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )

    return response.choices[0].message.content


def generate_flashcard(topic, difficulty):
    prompt = f"""
Generate ONE flashcard on "{topic}"
Difficulty: {difficulty}

Return JSON ONLY in this format:
{{
  "front": "...",
  "back": "..."
}}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )

    raw = response.choices[0].message.content.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError("AI did not return valid JSON for flashcard")



def generate_coding_question(topic, difficulty):
    prompt = f"""
Generate ONE coding question on "{topic}"
Difficulty: {difficulty}

Return JSON ONLY in this format:
{{
  "problem": "...",
  "starter_code": "...",
  "solution": "...",
  "test_cases": [
    {{"input": "...", "output": "..."}}
  ]
}}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )

    raw = response.choices[0].message.content.strip()
    return json.loads(raw)