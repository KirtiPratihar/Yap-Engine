"use client";
import { useState, useRef, useEffect } from 'react';

export default function YapEngine() {
  // --- STATE ---
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  // We now store objects { name: "...", url: "..." } instead of just strings
  const [documents, setDocuments] = useState([]); 
  const [activePdfUrl, setActivePdfUrl] = useState(null); // The PDF to show on the right
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // ⚠️ YOUR RENDER URL
  const API_URL = "https://yap-engine.onrender.com";

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- HANDLERS ---
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. IMMEDIATE UI UPDATE (Show PDF instantly)
    const objectUrl = URL.createObjectURL(file);
    setActivePdfUrl(objectUrl);
    setDocuments(prev => [...prev, { name: file.name, url: objectUrl }]); // Save to history
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 2. Send to Backend
      const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      
      if (!res.ok) throw new Error("Backend Error");
      
      setMessages(prev => [...prev, { type: 'ai', text: `✅ Successfully read "${file.name}". Ask me anything!` }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { type: 'ai', text: "⚠️ Uploaded to UI, but backend is sleeping. Give it a moment!" }]);
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
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
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        type: 'ai', 
        text: data.answer,
        source: 'PDF Context'
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'ai', text: "⚠️ Error connecting to brain." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-950 font-sans">
      
      {/* Header */}
      <header className="h-16 flex items-center px-8 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 shadow-lg shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✨</span>
          <h1 className="text-2xl font-black tracking-wide text-amber-900">YAP ENGINE</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Documents */}
        <aside className="w-64 bg-white/80 backdrop-blur-sm border-r border-amber-200 p-4 flex flex-col shrink-0">
          
          {/* Upload Button */}
          <label className={`w-full py-3 mb-6 rounded-xl font-semibold text-amber-900
            bg-gradient-to-r from-yellow-300 to-amber-300
            hover:from-yellow-400 hover:to-amber-400
            shadow-lg hover:shadow-xl
            transition-all duration-200 transform hover:scale-105
            flex items-center justify-center cursor-pointer ${uploading ? "opacity-50 cursor-wait" : ""}`}>
            
            {uploading ? "⏳ Reading..." : "📄 Upload PDF"}
            <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
          
          </label>

          <div className="flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">History</h3>
            <div className="space-y-2">
              {documents.length === 0 && <p className="text-xs text-amber-900/40 italic">No files yet.</p>}
              {documents.map((doc, i) => (
                <div 
                  key={i} 
                  onClick={() => setActivePdfUrl(doc.url)} // Click to show PDF again
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${activePdfUrl === doc.url ? "bg-yellow-100 border-amber-400" : "bg-amber-50 hover:bg-amber-100 border-amber-200"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📑</span>
                    <span className="text-sm text-amber-900 truncate">{doc.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center - Chat Area */}
        <section className="flex-1 flex flex-col min-w-0">
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                  <div className="text-6xl mb-4">💬</div>
                  <h2 className="text-2xl font-bold text-amber-900">Ask me anything</h2>
                  <p className="text-amber-700">Upload a PDF to see it on the right & start chatting!</p>
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
                    <p className="break-words leading-relaxed">{msg.text}</p>
                    {msg.source && (
                      <div className="mt-2 pt-2 border-t border-amber-200 text-xs text-amber-600 font-medium">
                        📍 {msg.source}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
               <div className="flex justify-start">
                 <div className="bg-white border border-amber-200 p-4 rounded-2xl shadow-md">
                   <div className="flex gap-2">
                     <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-100"></div>
                     <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-200"></div>
                   </div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-amber-200">
            <div className="flex gap-3 max-w-5xl mx-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 px-5 py-3 rounded-xl border-2 border-amber-200 
                  focus:border-amber-400 focus:outline-none
                  bg-white shadow-sm placeholder-amber-900/30"
                placeholder="Ask a question about your documents..."
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="px-6 py-3 rounded-xl font-semibold
                  bg-gradient-to-r from-yellow-400 to-amber-400
                  hover:from-yellow-500 hover:to-amber-500
                  shadow-lg hover:shadow-xl
                  transition-all duration-200 transform hover:scale-105
                  text-amber-900 disabled:opacity-50 disabled:scale-100">
                <span className="text-xl">➤</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar - PDF Viewer */}
        <aside className="w-[45%] bg-white border-l border-amber-200 flex flex-col shrink-0 hidden md:flex">
          <div className="h-12 flex items-center px-4 border-b border-amber-200 bg-amber-50/50">
            <span className="text-lg mr-2">📄</span>
            <h3 className="font-bold text-amber-900">Source Viewer</h3>
          </div>
          
          <div className="flex-1 relative bg-gray-100">
            {activePdfUrl ? (
              <iframe 
                src={activePdfUrl} 
                className="w-full h-full border-none" 
                title="PDF Preview"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-amber-900/40 p-8 text-center">
                <div className="text-4xl mb-4">👁️</div>
                <p>Upload a PDF to view it here instantly.</p>
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}