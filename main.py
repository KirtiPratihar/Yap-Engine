from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from pinecone import Pinecone
import os
import requests
from dotenv import load_dotenv
import groq
from fastapi.middleware.cors import CORSMiddleware
import json
from pypdf import PdfReader
import io
import time

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys
PINECONE_KEY = os.getenv("PINECONE_API_KEY")
GROQ_KEY = os.getenv("GROQ_API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

# Initialize
pc = Pinecone(api_key=PINECONE_KEY)
index = pc.Index("chat-index") 
client = groq.Groq(api_key=GROQ_KEY)

# ☁️ HUGGING FACE ROUTER EMBEDDING FUNCTION (Golden Version)
def get_embedding(text):
    if not HF_TOKEN:
        print("❌ Error: HF_TOKEN is missing")
        return None

    # ✅ Use clean Router URL
    api_url = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2"

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }

    # ✅ Wrap text in a list to force Embedding mode
    payload = {
        "inputs": [text],
        "options": {"wait_for_model": True}
    }

    for attempt in range(5):
        try:
            response = requests.post(api_url, headers=headers, json=payload)

            if response.status_code == 200:
                data = response.json()
                # Handle the nested list [[0.1, 0.2, ...]]
                if isinstance(data, list) and isinstance(data[0], list):
                    return data[0]  # Return the embedding vector

            elif response.status_code == 503:
                print(f"⏳ HF model loading... waiting 5s (Attempt {attempt+1})")
                time.sleep(5)

            else:
                print(f"⚠️ HF error {response.status_code}: {response.text}")
                time.sleep(1)

        except Exception as e:
            print(f"❌ Network error: {e}")
            time.sleep(1)

    return None

@app.get("/")
def home():
    return {"message": "Yap-Engine is Awake! 🚀"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    print(f"📥 Received file: {file.filename}")
    contents = await file.read()
    pdf_file = io.BytesIO(contents)
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""

    if not text.strip():
        return {"error": "PDF has no extractable text"}

    chunk_size = 1000
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

    vectors = []
    print(f"Processing {len(chunks)} chunks...")

    for i, chunk in enumerate(chunks):
        vector = get_embedding(chunk)
        if vector:
            if len(vector) != 384:
                print(f"❌ Chunk {i+1} has invalid embedding size")
                continue
            vectors.append({
                "id": f"{file.filename}_{i}",
                "values": vector,
                "metadata": {"text": chunk}
            })
            time.sleep(0.2)
        else:
            print(f"❌ Failed chunk {i+1}")

    if vectors:
        try:
            batch_size = 50
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i+batch_size]
                index.upsert(batch)
            print("✅ Upload Complete!")
            return {"filename": file.filename, "status": "Indexed Successfully"}
        except Exception as e:
            return {"error": str(e)}

    return {"error": "Could not generate embeddings."}

class Query(BaseModel):
    question: str

@app.post("/chat")
async def chat(query: Query):
    print(f"💬 Question: {query.question}")

    q_embedding = get_embedding(query.question)

    if not q_embedding:
        return {"answer": "⚠️ Error: Embedding model failed."}

    search_res = index.query(vector=q_embedding, top_k=5, include_metadata=True)
    context = "\n\n".join([match['metadata']['text'] for match in search_res['matches']]) or "No context found."

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant. Answer strictly based on the context provided. Use Markdown formatting (bold, lists) in your answer."},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {query.question}"}
        ],
        model="llama3-8b-8192",
    )

    return {
        "answer": chat_completion.choices[0].message.content,
        "source": context
    }
