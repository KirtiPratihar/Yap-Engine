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
HF_TOKEN = os.getenv("HF_TOKEN") # ✅ USING HUGGING FACE NOW

# Initialize
pc = Pinecone(api_key=PINECONE_KEY)
index = pc.Index("chat-index") 
client = groq.Groq(api_key=GROQ_KEY)

# ☁️ HUGGING FACE EMBEDDING FUNCTION (No Strict Rate Limits!)
def get_embedding(text):
    if not HF_TOKEN:
        print("❌ Error: HF_TOKEN is missing")
        return None

    # URL for the free all-MiniLM-L6-v2 model
    api_url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    
    # Retry logic for network blips
    for attempt in range(5): 
        try:
            payload = {"inputs": text, "options": {"wait_for_model": True}}
            response = requests.post(api_url, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                # Handle different response formats (List or List of Lists)
                if isinstance(data, list):
                    if len(data) > 0 and isinstance(data[0], list):
                        return data[0] 
                    return data
            
            elif response.status_code == 503:
                print(f"⏳ Model loading... waiting 5s (Attempt {attempt+1})")
                time.sleep(5)
                continue
            
            else:
                print(f"⚠️ Error {response.status_code}: {response.text}")
                time.sleep(1)

        except Exception as e:
            print(f"❌ Network Error: {e}")
            time.sleep(1)

    return None

@app.get("/")
def home():
    return {"message": "Yap-Engine (HF Edition) is Awake! 🚀"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    print(f"📥 Received file: {file.filename}")
    contents = await file.read()
    pdf_file = io.BytesIO(contents)
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""

    # Hugging Face handles smaller chunks better (~1000 chars)
    chunk_size = 1000 
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    
    vectors = []
    print(f"Processing {len(chunks)} chunks with Hugging Face...")

    for i, chunk in enumerate(chunks): 
        print(f"Processing chunk {i+1}/{len(chunks)}...") 
        
        vector = get_embedding(chunk)
        
        if vector:
            vectors.append({
                "id": f"{file.filename}_{i}",
                "values": vector,
                "metadata": {"text": chunk}
            })
            # Small courtesy pause (0.5s) is enough for HF
            time.sleep(0.5) 
        else:
            print(f"❌ Failed chunk {i+1}")

    if vectors:
        try:
            # Batch upsert
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
        return {"answer": "⚠️ Error: Embedding model failed. Check backend logs."}

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