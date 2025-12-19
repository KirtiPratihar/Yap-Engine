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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") # NEW KEY

# Initialize
pc = Pinecone(api_key=PINECONE_KEY)
index = pc.Index("chat-index") 
client = groq.Groq(api_key=GROQ_KEY)

# ☁️ NEW: Google Gemini Embedding Function (More Reliable)
def get_embedding(text):
    if not GEMINI_API_KEY:
        print("❌ Error: GEMINI_API_KEY is missing in Environment Variables.")
        return None

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key={GEMINI_API_KEY}"
    
    # Clean text slightly to avoid JSON errors
    clean_text = text.replace("\n", " ")
    payload = {
        "model": "models/embedding-001",
        "content": {
            "parts": [{
                "text": clean_text
            }]
        }
    }

    for attempt in range(3): 
        try:
            response = requests.post(api_url, json=payload)
            
            if response.status_code != 200:
                print(f"⚠️ Error {response.status_code}: {response.text}")
                time.sleep(2)
                continue

            data = response.json()
            # Extract embedding from Gemini response structure
            if "embedding" in data and "values" in data["embedding"]:
                return data["embedding"]["values"]
            
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
    chunk_size = 1000 # Gemini handles larger chunks better
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    
    vectors = []
    print(f"Processing {len(chunks)} chunks (Full Document)...")

    for i, chunk in enumerate(chunks): 
        print(f"Processing chunk {i+1}/{len(chunks)}...") 
        
        vector = get_embedding(chunk)
        
        if not vector:
            print(f"❌ Failed to process chunk {i+1}")
            continue
            
        vectors.append({
            "id": f"{file.filename}_{i}",
            "values": vector,
            "metadata": {"text": chunk}
        })
        
        time.sleep(0.2) # Small pause for safety

    if vectors:
        try:
            # Upsert in batches of 50
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
        return {"answer": "⚠️ Error: AI model is not responding. (Embedding failed)"}

    # Search Pinecone
    search_res = index.query(vector=q_embedding, top_k=5, include_metadata=True)
    
    # Get the context text
    context = "\n\n".join([match['metadata']['text'] for match in search_res['matches']])

    if not context:
        context = "No relevant context found in the document."

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful assistant. Answer the user's question strictly based on the context provided below. If the answer is not in the context, say 'I cannot find the answer in the document.'"},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {query.question}"}
        ],
        model="llama3-8b-8192",
    )
    
    response_text = chat_completion.choices[0].message.content
    
    return {
        "answer": response_text,
        "source": context
    }