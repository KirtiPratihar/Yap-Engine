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
HF_TOKEN = os.getenv("HF_TOKEN")  # New Key

# Initialize
pc = Pinecone(api_key=PINECONE_KEY)
index = pc.Index("chat-index")
client = groq.Groq(api_key=GROQ_KEY)

# ☁️ Lightweight Embedding (No RAM usage)
def get_embedding(text):
    api_url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    response = requests.post(api_url, headers=headers, json={"inputs": text, "options": {"wait_for_model": True}})
    return response.json()

@app.get("/")
def home():
    return {"message": "Yap-Engine is Awake and Lightweight! ☀️"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    contents = await file.read()
    pdf_file = io.BytesIO(contents)
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""

    chunk_size = 500
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    
    vectors = []
    for i, chunk in enumerate(chunks[:20]): 
        vector = get_embedding(chunk)
        if isinstance(vector, dict) and "error" in vector:
             print(f"HF Error: {vector}")
             continue
        if isinstance(vector, list) and isinstance(vector[0], list):
            vector = vector[0]
            
        vectors.append({
            "id": f"{file.filename}_{i}",
            "values": vector,
            "metadata": {"text": chunk}
        })

    if vectors:
        index.upsert(vectors)
    
    return {"filename": file.filename, "status": "Indexed"}

class Query(BaseModel):
    question: str

@app.post("/chat")
async def chat(query: Query):
    q_embedding = get_embedding(query.question)
    if isinstance(q_embedding, list) and isinstance(q_embedding[0], list):
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