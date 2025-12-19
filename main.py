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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 

# Initialize
pc = Pinecone(api_key=PINECONE_KEY)
index = pc.Index("chat-index") 
client = groq.Groq(api_key=GROQ_KEY)

# ☁️ SMART EMBEDDING FUNCTION (Handles Rate Limits)
def get_embedding(text):
    if not GEMINI_API_KEY:
        print("❌ Error: GEMINI_API_KEY is missing.")
        return None

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key={GEMINI_API_KEY}"
    
    clean_text = text.replace("\n", " ")
    payload = {
        "model": "models/embedding-001",
        "content": { "parts": [{ "text": clean_text }] }
    }

    # Retry up to 3 times
    for attempt in range(3): 
        try:
            response = requests.post(api_url, json=payload)
            
            # ✅ SUCCESS
            if response.status_code == 200:
                data = response.json()
                if "embedding" in data and "values" in data["embedding"]:
                    return data["embedding"]["values"]

            # 🛑 RATE LIMIT (429) -> WAIT AND RETRY
            elif response.status_code == 429:
                print(f"⚠️ Quota hit! Waiting 30 seconds before retrying... (Attempt {attempt+1})")
                time.sleep(30) 
                continue # Try again
            
            # OTHER ERRORS
            else:
                print(f"⚠️ Error {response.status_code}: {response.text}")
                time.sleep(2)

        except Exception as e:
            print(f"❌ Network Error: {e}")
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

    # Chunk text
    chunk_size = 1000 
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    
    vectors = []
    print(f"Processing {len(chunks)} chunks...")

    for i, chunk in enumerate(chunks): 
        vector = get_embedding(chunk)
        
        if not vector:
            print(f"❌ Failed to process chunk {i+1}")
            continue
            
        vectors.append({
            "id": f"{file.filename}_{i}",
            "values": vector,
            "metadata": {"text": chunk}
        })
        
        # ⏳ Add a small delay between every request to be nice to the API
        time.sleep(1.0) 

    if vectors:
        try:
            # Upsert in small batches
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
        return {"answer": "⚠️ I am busy! Please wait 30 seconds and try again."}

    search_res = index.query(vector=q_embedding, top_k=5, include_metadata=True)
    context = "\n\n".join([match['metadata']['text'] for match in search_res['matches']]) or "No context found."

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant. Answer strictly based on the context provided."},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {query.question}"}
        ],
        model="llama3-8b-8192",
    )
    
    return {
        "answer": chat_completion.choices[0].message.content,
        "source": context
    }