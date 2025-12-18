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
import time # Added for delays

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
# ☁️ Patient Embedding Function (Corrected Router URL)
def get_embedding(text):
    # ✅ CORRECT URL STRUCTURE (Uses /models/ instead of /pipeline/)
    api_url = "https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    
    for attempt in range(10):
        try:
            response = requests.post(api_url, headers=headers, json={"inputs": text, "options": {"wait_for_model": True}})
            
            # Debugging: If it fails, print what the server actually said
            if response.status_code != 200:
                print(f"⚠️ Server Error ({response.status_code}): {response.text}")
                time.sleep(2)
                continue

            data = response.json()
            
            # ✅ Success
            if isinstance(data, list):
                return data
            
            # 💤 Loading
            if isinstance(data, dict) and "error" in data:
                print(f"⚠️ Model loading (Attempt {attempt+1}/10)... waiting 5s")
                time.sleep(5)
                continue
                
        except Exception as e:
            print(f"Network error: {e}")
            time.sleep(2)

    return None

@app.get("/")
def home():
    return {"message": "Yap-Engine is Awake and Robust! 🛡️"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
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
    print(f"Processing {len(chunks)} chunks...")

    for i, chunk in enumerate(chunks[:20]): 
        vector = get_embedding(chunk)
        
        # 🛡️ SAFETY CHECK: Only add if it's actually a list of numbers
        if not vector or not isinstance(vector, list):
            print(f"❌ Skipping bad chunk {i}: {vector}")
            continue
            
        # Flatten if nested [[...]] -> [...]
        if isinstance(vector[0], list):
            vector = vector[0]
            
        vectors.append({
            "id": f"{file.filename}_{i}",
            "values": vector,
            "metadata": {"text": chunk}
        })

    if vectors:
        try:
            index.upsert(vectors)
            return {"filename": file.filename, "status": "Indexed Successfully"}
        except Exception as e:
            print(f"Pinecone Error: {e}")
            return {"error": str(e)}
    
    return {"error": "Could not generate embeddings. Try again in 1 minute."}

class Query(BaseModel):
    question: str

@app.post("/chat")
async def chat(query: Query):
    q_embedding = get_embedding(query.question)
    
    if not q_embedding or not isinstance(q_embedding, list):
        return {"answer": "⚠️ My brain is still waking up (Model Loading). Please ask again in 10 seconds!"}

    if isinstance(q_embedding[0], list):
        q_embedding = q_embedding[0]

    search_res = index.query(vector=q_embedding, top_k=3, include_metadata=True)
    context = "\n".join([match['metadata']['text'] for match in search_res['matches']])

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant. Answer based on the context provided."},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {query.question}"}
        ],
        model="llama3-8b-8192",
    )
    return {"answer": chat_completion.choices[0].message.content}