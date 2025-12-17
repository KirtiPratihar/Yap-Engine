'use client'

import { useState, useRef, useEffect } from 'react';

export default function YapEngine() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // YOUR BACKEND URL 
  const API_URL = "https://yap-engine.onrender.com";

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 📤 HANDLE FILE UPLOAD (REAL)
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, { 
        method: "POST", 
        body: formData 
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      setDocuments(prev => [...prev, file.name]);
      setMessages(prev => [...prev, { 
        type: 'ai', 
        text: `✅ Successfully uploaded "${file.name}". You can now ask questions about it!` 
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        type: 'ai', 
        text: "❌ Upload failed. Make sure your backend is running!" 
      }]);
    } finally {
      setUploading(false);
    }
  };

  // 💬 SEND MESSAGE (REAL)
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg }),
      });
      
      if (!res.ok) throw new Error("Chat request failed");
      
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        type: 'ai', 
        text: data.answer || data.response || "I couldn't find an answer.",
        source: data.source || null
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        type: 'ai', 
        text: "⚠️ Error connecting to backend. Is it running?" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(to bottom right, #fffbeb, #fef3c7)'
    }}>
      
      {/* Header */}
      <header style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem',
        background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.875rem' }}>✨</span>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '900', 
            letterSpacing: '0.05em',
            color: '#78350f'
          }}>YAP ENGINE</h1>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Sidebar - 20% */}
        <aside style={{
          width: '20%',
          minWidth: '240px',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid #fcd34d',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 🔥 REAL UPLOAD BUTTON */}
          <label style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            borderRadius: '12px',
            fontWeight: '600',
            color: '#78350f',
            background: uploading ? '#d1d5db' : 'linear-gradient(to right, #fde047, #fbbf24)',
            border: 'none',
            cursor: uploading ? 'wait' : 'pointer',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s',
            textAlign: 'center',
            display: 'block'
          }}>
            {uploading ? '⏳ Uploading...' : '📄 Upload PDF'}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="application/pdf" 
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <h3 style={{ 
              fontSize: '0.75rem', 
              fontWeight: '700', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#b45309',
              marginBottom: '0.75rem'
            }}>Documents</h3>
            {documents.length === 0 ? (
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#f59e0b', 
                textAlign: 'center',
                marginTop: '2rem'
              }}>No documents uploaded yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {documents.map((doc, i) => (
                  <div key={i} style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: '#fef3c7',
                    border: '1px solid #fcd34d',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem' }}>📑</span>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        color: '#78350f',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{doc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center - Chat Area (60%) */}
        <section style={{ 
          width: '60%', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          
          {/* Messages */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.length === 0 ? (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <div style={{ 
                  textAlign: 'center', 
                  maxWidth: '28rem'
                }}>
                  <div style={{ fontSize: '8rem', marginBottom: '1rem' }}>💬</div>
                  <h2 style={{ 
                    fontSize: '2rem', 
                    fontWeight: '700', 
                    color: '#78350f',
                    marginBottom: '1rem'
                  }}>Ask me anything</h2>
                  <p style={{ fontSize: '1.125rem', color: '#b45309' }}>
                    Upload a PDF and start asking questions about your documents
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' 
                  }}>
                    <div style={{
                      maxWidth: '75%',
                      padding: '1rem',
                      borderRadius: '16px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      background: msg.type === 'user' 
                        ? 'linear-gradient(to right, #fbbf24, #f59e0b)'
                        : 'white',
                      color: msg.type === 'user' ? '#78350f' : '#1f2937',
                      border: msg.type === 'user' ? 'none' : '1px solid #fcd34d'
                    }}>
                      <p style={{ wordBreak: 'break-word' }}>{msg.text}</p>
                      {msg.source && (
                        <div style={{
                          marginTop: '0.5rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid #fcd34d',
                          fontSize: '0.75rem',
                          color: '#d97706'
                        }}>
                          📍 {msg.source}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      padding: '1rem',
                      borderRadius: '16px',
                      background: 'white',
                      border: '1px solid #fcd34d',
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        background: '#fbbf24', 
                        borderRadius: '50%',
                        animation: 'bounce 1.4s infinite ease-in-out'
                      }}></div>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        background: '#fbbf24', 
                        borderRadius: '50%',
                        animation: 'bounce 1.4s infinite ease-in-out 0.2s'
                      }}></div>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        background: '#fbbf24', 
                        borderRadius: '50%',
                        animation: 'bounce 1.4s infinite ease-in-out 0.4s'
                      }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #fcd34d'
          }}>
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem',
              maxWidth: '80rem',
              margin: '0 auto'
            }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: '2px solid #fcd34d',
                  outline: 'none',
                  background: 'white',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  fontSize: '1rem',
                  opacity: loading ? 0.5 : 1
                }}
                placeholder="Ask a question about your documents..."
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: '600',
                  background: (!input.trim() || loading) ? '#d1d5db' : 'linear-gradient(to right, #fbbf24, #f59e0b)',
                  border: 'none',
                  cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  color: '#78350f',
                  transition: 'all 0.2s'
                }}>
                <span style={{ fontSize: '1.25rem' }}>➤</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar - 20% */}
        <aside style={{
          width: '20%',
          minWidth: '280px',
          background: 'white',
          borderLeft: '1px solid #fcd34d',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid #fcd34d'
          }}>
            <span style={{ fontSize: '1.125rem' }}>📄</span>
            <h3 style={{ fontWeight: '700', color: '#78350f' }}>Source Context</h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#f59e0b',
              textAlign: 'center',
              marginTop: '2rem',
              lineHeight: '1.5'
            }}>
              Source excerpts will appear here when you ask questions
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}