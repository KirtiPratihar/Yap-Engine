# ✨ Yap Engine - Intelligent PDF Chatbot (RAG)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)  
[![GitHub issues](https://img.shields.io/github/issues/KirtiPratihar/Yap-Engine)](https://github.com/KirtiPratihar/Yap-Engine/issues)  
[![GitHub stars](https://img.shields.io/github/stars/KirtiPratihar/Yap-Engine)](https://github.com/KirtiPratihar/Yap-Engine/stargazers)

**Yap Engine** is a cutting-edge **Retrieval-Augmented Generation (RAG)** application that allows users to interact with PDF documents in real-time using AI.  

Built for **speed, privacy, and multi-user support**, it integrates **Groq Llama 3.3**, **Hugging Face embeddings**, and **Pinecone Namespaces** to provide seamless, isolated AI-assisted document analysis.

![Yap Engine Screenshot](.\assets\demo.png)

---

## 🚀 Key Features

- **📂 Drag & Drop PDF Upload:** Easy and intuitive file upload.  
- **⚡ Ultra-Fast AI Responses:** Powered by **Groq Llama 3.3 70B**.  
- **🧠 Smart Semantic Search:** High-quality embeddings via Hugging Face `BAAI/bge-small-en-v1.5`.  
- **🔒 Multi-User Isolation:** Separate Pinecone namespaces per session.  
- **📝 Document Summarization:** Generate bullet-point summaries in one click.  
- **🎨 Responsive, Modern UI:** Tailored for clarity and user-friendliness.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js](https://nextjs.org/) (React-based)  
- **Styling:** CSS-in-JS / Tailwind concepts  
- **State Management:** React Hooks (`useState`, `useEffect`)  
- **Markdown Rendering:** `react-markdown`  

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)  
- **Vector Database:** [Pinecone](https://www.pinecone.io/)  
- **LLM Provider:** [Groq](https://groq.com/) (Llama 3.3)  
- **Embeddings:** Hugging Face Inference API (`BAAI/bge-small-en-v1.5`)  
- **PDF Parsing:** `pypdf`  

---

## 🏗️ Architecture

```
User Uploads PDF
       ↓
Frontend Generates Session ID
       ↓
Backend Extracts Text with pypdf
       ↓
Text Split into Chunks (1000 chars)
       ↓
Hugging Face Embeddings (384 dims)
       ↓
Vectors Upserted into Pinecone Namespace
       ↓
User Asks Question
       ↓
Query Embedding
       ↓
Search Relevant Vectors in Namespace
       ↓
Groq LLM Generates Answer
       ↓
Frontend Displays Response
```

### Pipeline Steps

1. Upload PDF via frontend drag-and-drop.
2. Generate a unique `x-session-id` for multi-user isolation.
3. Backend extracts text and splits it into 1000-character chunks.
4. Each chunk is embedded via Hugging Face (384 dims) and stored in Pinecone under the session namespace.
5. Queries are embedded and matched against the same namespace for context-aware answers.
6. Groq LLM generates final responses using retrieved context.

---

## ⚙️ Installation & Setup

### Prerequisites

* Python 3.10+
* Node.js 18+
* API Keys for:
  * **Pinecone**: Index `chat-index` (Dim: 384, Metric: Cosine)
  * **Groq**: LLM API
  * **Hugging Face**: Fine-grained token

---

## 📦 Backend Setup (FastAPI)

### Step 1: Clone & Navigate

```bash
git clone https://github.com/KirtiPratihar/Yap-Engine.git
cd Yap-Engine/backend
```

### Step 2: Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install fastapi uvicorn pinecone-client groq requests python-dotenv pypdf python-multipart
```

### Step 4: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
touch .env
```

Add the following to `.env`:

```env
PINECONE_API_KEY=your_pinecone_key_here
GROQ_API_KEY=your_groq_key_here
HF_TOKEN=your_huggingface_token_here
```

**How to get these keys:**

- **Pinecone API Key**: Sign up at [pinecone.io](https://www.pinecone.io/), create an index named `chat-index` with dimension 384 and cosine metric.
- **Groq API Key**: Get it from [console.groq.com](https://console.groq.com).
- **Hugging Face Token**: Generate from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).

### Step 5: Run Backend Server

```bash
uvicorn app:app --reload
```

The backend will be available at `http://127.0.0.1:8000`

---

## 🎨 Frontend Setup (Next.js)

### Step 1: Navigate to Frontend Directory

```bash
cd ../frontend
```

### Step 2: Install Dependencies

```bash
npm install react-markdown
```

### Step 3: Run Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## 📝 Usage Guide

1. **Open the App**: Navigate to `http://localhost:3000` in your browser.
2. **Upload PDF**: Drag and drop your PDF document into the upload area.
3. **Wait for Indexing**: The system will extract and embed your document content.
4. **Ask Questions**: Type your questions about the PDF content in the chat interface.
5. **View Answers**: Receive AI-powered responses based on your document.
6. **Reset Session**: Click **🗑️ Clear History & Reset** to start a new session with a different PDF.

---

## 🔧 API Endpoints

### Upload PDF

**POST** `/upload`

Request (multipart/form-data):
```
file: <PDF file>
x-session-id: <unique-session-id>
```

Response:
```json
{
  "status": "success",
  "message": "PDF indexed successfully",
  "chunks_created": 25
}
```

### Query PDF

**POST** `/query`

Request:
```json
{
  "question": "What is this document about?",
  "x-session-id": "unique-session-id"
}
```

Response:
```json
{
  "answer": "This document is about...",
  "sources": ["chunk_1", "chunk_2"]
}
```

### Summarize Document

**POST** `/summarize`

Request:
```json
{
  "x-session-id": "unique-session-id"
}
```

Response:
```json
{
  "summary": "• Point 1\n• Point 2\n• Point 3"
}
```

---

## 🤝 Contributing

We welcome contributions! Follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m "Add AmazingFeature"`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

Please ensure your code follows best practices and includes proper documentation.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🐛 Troubleshooting

### Issue: "PINECONE_API_KEY not found"
**Solution**: Ensure your `.env` file is in the `backend` directory and properly formatted.

### Issue: "Connection refused on port 8000"
**Solution**: Make sure the FastAPI server is running (`uvicorn app:app --reload`).

### Issue: "Hugging Face API timeout"
**Solution**: Check your internet connection and ensure your HF_TOKEN is valid.

### Issue: Frontend can't connect to backend
**Solution**: Verify CORS is enabled in FastAPI and the backend is running on `http://127.0.0.1:8000`.

---

## 📬 Support & Feedback

Found a bug or have a suggestion? Please open an [issue](https://github.com/KirtiPratihar/Yap-Engine/issues) on GitHub.

---

**Built by [Kirti Pratihar](https://github.com/KirtiPratihar)**

**Last Updated**: December 2025