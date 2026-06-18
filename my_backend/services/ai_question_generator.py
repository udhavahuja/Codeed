import os
import json
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_question_ai(
    question_type,
    topic_name,
    difficulty
):
    """
    question_type: mcq | flashcard | coding
    """

    if question_type == "mcq":
      prompt = f"""
                Create ONE multiple-choice question.

                Topic: {topic_name}
                Difficulty: {difficulty}

                RULES (IMPORTANT):
                1) Always return EXACT valid JSON
                2) Options must be labeled A, B, C, D
                3) The answer MUST be ONLY the letter (A/B/C/D)
                4) Do NOT include explanations
                5) Keep options short

                Return ONLY JSON like this:

                {{
                  "question": "What is 2 + 2?",
                  "options": {{
                            "A": "3",
                            "B": "4",
                            "C": "5",
                            "D": "6"
                          }},
                  "answer": "B"
                }}
                """


    elif question_type == "flashcard":
        prompt = f"""
        Create ONE flashcard for topic: {topic_name}
        Difficulty: {difficulty}

        Return ONLY valid JSON:
        {{
          "front": "...",
          "back": "..."
        }}
        """

    elif question_type == "coding":
        prompt = f"""
        Create ONE beginner-friendly coding question for topic: {topic_name}
        Difficulty: {difficulty}
        Keep the problem statement simple and concise. It should not exceed 1-2 sentences.

        Return ONLY valid JSON:
        {{
          "problem": "...",
          "starter_code": "...",
          "solution": "...",
          "test_cases": [
            {{"input": "...", "output": "..."}}
          ]
        }}
        """

    else:
        raise ValueError("Invalid question type")

    response = client.chat.completions.create(
        model="llama3-8b-8192",  # CURRENT supported Groq model
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )

    raw_text = response.choices[0].message.content.strip()

    # Safety: ensure valid JSON
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        raise ValueError("AI did not return valid JSON")
