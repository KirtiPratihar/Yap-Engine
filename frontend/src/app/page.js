
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-amber-50 to-yellow-50">
      
      {/* Header */}
      <header className="h-16 flex items-center px-8 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✨</span>
          <h1 className="text-2xl font-black tracking-wide text-amber-900">YAP ENGINE</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Documents */}
        <aside className="w-64 bg-white/80 backdrop-blur-sm border-r border-amber-200 p-4 flex flex-col">
          <button className="w-full py-3 mb-6 rounded-xl font-semibold text-amber-900
            bg-gradient-to-r from-yellow-300 to-amber-300
            hover:from-yellow-400 hover:to-amber-400
            shadow-lg hover:shadow-xl
            transition-all duration-200 transform hover:scale-105">
            📄 Upload PDF
          </button>

          <div className="flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">Documents</h3>
            {documents.length === 0 ? (
              <p className="text-sm text-amber-500 text-center mt-8">No documents uploaded yet</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div key={i} className="p-3 rounded-lg bg-amber-50 hover:bg-amber-100 
                    cursor-pointer transition-colors border border-amber-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📑</span>
                      <span className="text-sm text-amber-900 truncate">{doc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center - Chat Area (BIGGER) */}
        <section className="flex-1 flex flex-col">
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                  <div className="text-6xl mb-4">💬</div>
                  <h2 className="text-2xl font-bold text-amber-900">Ask me anything</h2>
                  <p className="text-amber-700">Upload a PDF and start asking questions about your documents</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl shadow-md ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-amber-900 ml-auto' 
                      : 'bg-white border border-amber-200'
                  }`}>
                    <p className="break-words">{msg.text}</p>
                    {msg.source && (
                      <div className="mt-2 pt-2 border-t border-amber-200 text-xs text-amber-600">
                        📍 {msg.source}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-amber-200">
            <div className="flex gap-3 max-w-5xl mx-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 px-5 py-3 rounded-xl border-2 border-amber-200 
                  focus:border-amber-400 focus:outline-none
                  bg-white shadow-sm"
                placeholder="Ask a question about your documents..."
              />
              <button
                onClick={sendMessage}
                className="px-6 py-3 rounded-xl font-semibold
                  bg-gradient-to-r from-yellow-400 to-amber-400
                  hover:from-yellow-500 hover:to-amber-500
                  shadow-lg hover:shadow-xl
                  transition-all duration-200 transform hover:scale-105
                  text-amber-900">
                <span className="text-xl">➤</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar - Source Viewer */}
        <aside className="w-80 bg-white border-l border-amber-200 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-200">
            <span className="text-lg">📄</span>
            <h3 className="font-bold text-amber-900">Source Context</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="text-sm text-amber-700 leading-relaxed space-y-3">
              <p className="text-center text-amber-500 mt-8">
                Source excerpts will appear here when you ask questions
              </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}