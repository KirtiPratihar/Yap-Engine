'use client'

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function YapEngine() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sourceContext, setSourceContext] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_URL = "https://yap-engine.onrender.com";

  useEffect(() => {
    // 1. Generate ID immediately on load if missing
    let id = localStorage.getItem("yap_session_id");
    if (!id) {
      id = "user_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("yap_session_id", id);
    }
    setSessionId(id);
    
    const saved = localStorage.getItem('chat_history');
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processFile = async (file) => {
    if (!file) return;
    if (!sessionId) {
        alert("Session ID missing. Please refresh the page.");
        return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, { 
        method: "POST", 
        headers: { "x-session-id": sessionId }, 
        body: formData 
      });

      if (!res.ok) throw new Error("Upload failed");

      setDocuments(prev => [...prev, file.name]);
      setSourceContext({ title: "Success", content: `Uploaded ${file.name}` });
      setMessages(prev => [...prev, { type: 'ai', text: `✅ Uploaded ${file.name}` }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { type: 'ai', text: "❌ Upload failed." }]);
    } finally {
      setUploading(false);
      setIsDragging(false);
    }
  };

  const handleFileInput = (e) => processFile(e.target.files?.[0]);
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === "application/pdf") processFile(file);
  };

  const handleSummarize = () => {
    if (loading) return;
    sendMessage("Summarize this document in 5 key bullet points.");
  };

  const sendMessage = async (textOverride = null) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading || !sessionId) return;

    if (!textOverride) setInput('');
    setMessages(prev => [...prev, { type: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId 
        },
        body: JSON.stringify({ question: textToSend }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.json();
      if (data.source) setSourceContext({ title: "Context", content: data.source });

      setMessages(prev => [...prev, { 
        type: 'ai', 
        text: data.answer || "No answer found.",
        source: data.source
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'ai', text: "⚠️ Error connecting to backend." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fffbeb' }}>
      {/* Header */}
      <header style={{ padding: '0 2rem', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fbbf24' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#78350f' }}>✨ YAP ENGINE</h1>
        <button 
          onClick={() => {
            localStorage.removeItem('chat_history');
            localStorage.removeItem('yap_session_id'); // KILL THE ID
            window.location.reload(); 
          }}
          style={{ background: 'rgba(255,255,255,0.3)', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', color: '#78350f' }}
        >
          🗑️ Reset Session
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ width: '250px', padding: '1rem', borderRight: '1px solid #fcd34d', display: 'flex', flexDirection: 'column' }}>
          <div 
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            style={{ 
              padding: '2rem', border: isDragging ? '2px dashed #78350f' : '2px dashed #fbbf24', 
              borderRadius: '12px', textAlign: 'center', background: isDragging ? '#fbbf24' : '#fff' 
            }}
          >
            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileInput} style={{display:'none'}} />
            <button onClick={() => fileInputRef.current.click()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', color: '#78350f' }}>
              {uploading ? '⏳ Uploading...' : '📂 Upload PDF'}
            </button>
          </div>
          
          <button onClick={handleSummarize} disabled={loading} style={{ marginTop: '1rem', padding: '0.8rem', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            ⚡ Summarize
          </button>

          <div style={{ marginTop: 'auto', padding: '0.5rem', background: '#eee', borderRadius: '4px', fontSize: '0.7rem', wordBreak: 'break-all' }}>
            <strong>Your ID:</strong><br/>{sessionId}
          </div>
        </aside>

        {/* Chat */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                padding: '1rem', margin: '0.5rem 0', borderRadius: '12px', maxWidth: '80%',
                alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                background: msg.type === 'user' ? '#fbbf24' : 'white',
                border: '1px solid #e5e7eb', marginLeft: msg.type === 'user' ? 'auto' : '0'
              }}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              value={input} onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(null)}
              placeholder="Ask anything..." 
              style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '2px solid #fbbf24' }} 
            />
            <button onClick={() => sendMessage(null)} style={{ padding: '0 1.5rem', background: '#fbbf24', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>➤</button>
          </div>
        </section>
      </div>
    </div>
  );
}