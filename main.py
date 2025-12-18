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

# ☁️ Robust Embedding Function
def get_embedding(text):
    api_url = "https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    
    for attempt in range(5): 
        try:
            payload = {"inputs": text, "options": {"wait_for_model": True}}
            response = requests.post(api_url, headers=headers, json=payload)
            
            if response.status_code != 200:
                print(f"⚠️ Error {response.status_code}: {response.text}")
                if response.status_code == 429: 
                    time.sleep(10) # Cooldown if blocked
                else:
                    time.sleep(2)
                continue

            data = response.json()
            if isinstance(data, list):
                return data
                
        except Exception as e:
            print(f"❌ Network Error: {e}")
            time.sleep(2)

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

    # Chunk text
    chunk_size = 500
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    
    vectors = []
    print(f"Processing {len(chunks)} chunks (Full Document)...")

    # ✅ FIXED: Loop through ALL chunks (No limit)
    for i, chunk in enumerate(chunks): 
        print(f"Processing chunk {i+1}/{len(chunks)}...") # Progress Log
        
        vector = get_embedding(chunk)
        
        if not vector:
            print(f"❌ Failed to process chunk {i+1}")
            continue
            
        vectors.append({
            "id": f"{file.filename}_{i}",
            "values": vector,
            "metadata": {"text": chunk}
        })
        
        # ⏳ Safety Pause: 0.5s is usually enough to prevent 429 errors
        time.sleep(0.5)

    if vectors:
        try:
            # Upsert in batches of 100 to be safe
            batch_size = 100
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
    q_embedding = get_embedding(query.question)
    
    if not q_embedding:
        return {"answer": "⚠️ Error: AI model is not responding."}

    search_res = index.query(vector=q_embedding, top_k=5, include_metadata=True)
    context = "\n".join([match['metadata']['text'] for match in search_res['matches']])

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant. Answer based on the context provided."},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {query.question}"}
        ],
        model="llama3-8b-8192",
    )
    return {"answer": chat_completion.choices[0].message.content}