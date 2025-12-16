# 🗣️ Yap-Engine
> *"The only AI that yaps more than your ex."*

[![Built With](https://img.shields.io/badge/Built%20With-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Yapping Level](https://img.shields.io/badge/Yapping%20Level-OVER%209000-red?style=for-the-badge)](https://en.wikipedia.org/wiki/It%27s_Over_9000!)
[![Vibe Check](https://img.shields.io/badge/Vibe-Immaculate-pink?style=for-the-badge)](https://www.urbandictionary.com/define.php?term=Immaculate%20Vibes)

## 🔗 Try it Live
**[👉 Click Here to Start Yapping (Live Demo)](https://yap-engine.vercel.app)**
*(Backend hosted on Render, Frontend on Vercel)*

## 🧐 What is this?
You know how you have that one 50-page PDF assignment you **really** don't want to read? 

**Yap-Engine** reads it for you. 

It's a Retrieval-Augmented Generation (RAG) system that ingests your boring documents, turns them into math (vectors), and then lets you ask questions so you never have to `Ctrl+F` again. It essentially turns your PDF into a know-it-all chatbot.

## ✨ Features (The Good Stuff)
* **📄 PDF Ingestion:** Eats PDFs for breakfast.
* **🧠 Pinecone Memory:** Uses `Pinecone` Vector DB so it actually remembers what it read (unlike me during exams).
* **⚡ Groq Speed:** Powered by `Groq` API (Llama 3), making it faster than your reply texts.
* **🤥 Hallucination Free-ish:** It *tries* to only answer from the document. If it doesn't know, it (usually) admits defeat instead of gaslighting you.

## 🛠️ The Stack
* **Frontend:** Next.js + Tailwind CSS (The Face)
* **Backend:** Python + FastAPI (The Brain)
* **AI Model:** Groq (Llama-3-8b-8192)
* **Embeddings:** Sentence-Transformers (all-MiniLM-L6-v2)
* **Vector DB:** Pinecone (The Hippocampus)
* **Vibes:** 100% Organic

## 🚀 How to Run Locally

### 1. Clone this chaos
```bash
git clone [https://github.com/KirtiPratihar/Yap-Engine.git](https://github.com/KirtiPratihar/Yap-Engine.git)
cd Yap-Engine
