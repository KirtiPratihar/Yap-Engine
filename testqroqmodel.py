import os
import groq
from dotenv import load_dotenv

load_dotenv()

GROQ_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_KEY:
    raise ValueError("GROQ_KEY is missing!")

client = groq.Groq(api_key=GROQ_KEY)

try:
    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say hello in a friendly way."}
        ],
        model="llama-3.3-70b-versatile",
    )
    print("✅ Model is reachable!")
    print("Response:", response.choices[0].message.content)
except groq.BadRequestError as e:
    print("❌ Error:", e)
except Exception as e:
    print("⚠️ Other error:", e)
