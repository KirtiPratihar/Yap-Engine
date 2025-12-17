'use client'

import { useState } from 'react';

export default function YapEngine() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [documents, setDocuments] = useState([]);

  const sendMessage = () => {
    if (!input.trim()) return;
    
    setMessages([...messages, {
      type: 'user',
      text: input
    }]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'ai',
        text: 'Based on the uploaded documents, I found relevant information...',
        source: 'Page 3, research_paper.pdf'
      }]);
    }, 800);
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
          <button style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            borderRadius: '12px',
            fontWeight: '600',
            color: '#78350f',
            background: 'linear-gradient(to right, #fde047, #fbbf24)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
          }}>
            📄 Upload PDF
          </button>

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
              messages.map((msg, i) => (
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
              ))
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
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: '2px solid #fcd34d',
                  outline: 'none',
                  background: 'white',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  fontSize: '1rem'
                }}
                placeholder="Ask a question about your documents..."
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: '600',
                  background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  color: '#78350f',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
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