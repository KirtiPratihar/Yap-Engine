from fastapi import FastAPI, UploadFile, File, HTTPException, Header
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

# ✅ UPDATE: Explicitly allow the session header
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["x-session-id", "Content-Type", "*"], 
)

# API Keys
PINECONE_KEY = os.getenv("PINECONE_API_KEY")
GROQ_KEY = os.getenv("GROQ_API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

# Initialize
pc = Pinecone(api_key=PINECONE_KEY)
index = pc.Index("chat-index") 
client = groq.Groq(api_key=GROQ_KEY)

# ☁️ EMBEDDING FUNCTION (BGE-Small)
def get_embedding(text):
    if not HF_TOKEN:
        return None
    api_url = "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5"
    headers = {"Authorization": f"Bearer {HF_TOKEN}", "Content-Type": "application/json"}
    payload = {"inputs": [text], "options": {"wait_for_model": True}}

    for attempt in range(5):
        try:
            response = requests.post(api_url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and isinstance(data[0], list):
                    return data[0]
                return data
            time.sleep(1)
        except Exception:
            time.sleep(1)
    return None

@app.get("/")
def home():
    return {"message": "Yap-Engine is Awake! 🚀"}

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...), 
    x_session_id: str = Header(...) # ❌ REMOVED default. Now it is required.
):
    print(f"📥 UPLOAD | Session: {x_session_id} | File: {file.filename}")
    
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
    
    for i, chunk in enumerate(chunks): 
        vector = get_embedding(chunk)
        if vector:
            vectors.append({
                "id": f"{x_session_id}_{file.filename}_{i}",
                "values": vector,
                "metadata": {"text": chunk}
            })
            time.sleep(0.2) 

    if vectors:
        try:
            batch_size = 50
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i+batch_size]
                # Save to specific namespace
                index.upsert(batch, namespace=x_session_id) 
            return {"filename": file.filename, "status": "Indexed Successfully"}
        except Exception as e:
            return {"error": str(e)}
    
    return {"error": "Could not generate embeddings."}

class Query(BaseModel):
    question: str

@app.post("/chat")
async def chat(
    query: Query, 
    x_session_id: str = Header(...) # ❌ REMOVED default. Now it is required.
):
    print(f"💬 CHAT | Session: {x_session_id} | Question: {query.question}")
    
    q_embedding = get_embedding(query.question)
    if not q_embedding:
        return {"answer": "⚠️ Error: Embedding model failed."}

    # Search specific namespace
    search_res = index.query(
        vector=q_embedding, 
        top_k=5, 
        include_metadata=True, 
        namespace=x_session_id 
    )

    context = "\n\n".join([match['metadata']['text'] for match in search_res['matches']]) or "No context found."

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant. Answer strictly based on the context provided."},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {query.question}"}
        ],
        model="llama-3.3-70b-versatile", 
    )
    
    return {
        "answer": chat_completion.choices[0].message.content,
        "source": context
    }