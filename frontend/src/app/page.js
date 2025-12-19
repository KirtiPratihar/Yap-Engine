"use client";
import { useState, useRef, useEffect } from 'react';

export default function YapEngine() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [documents, setDocuments] = useState([]);
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [activePdfName, setActivePdfName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chunks, setChunks] = useState(0);
  
  const messagesEndRef = useRef(null);
  
  // Change this to your actual API URL
  const API_URL = "https://yap-engine.onrender.com";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      alert('Please upload a PDF file!');
      return;
    }

    // INSTANTLY show PDF in viewer
    const objectUrl = URL.createObjectURL(file);
    setActivePdfUrl(objectUrl);
    setActivePdfName(file.name);
    setDocuments(prev => [...prev, { name: file.name, url: objectUrl }]);
    setUploading(true);

    // Upload to backend
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, { 
        method: "POST", 
        body: formData 
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      setChunks(data.chunks || 0);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: `✅ Successfully processed "${file.name}"! I've read ${data.pages} pages and created ${data.chunks} knowledge chunks. Ask me anything! 🧠` 
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: "⚠️ PDF is displayed, but couldn't connect to backend. Make sure your FastAPI server is running on port 8000!" 
      }]);
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
      const res = await fetch(`${API_URL}/yap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg }),
      });
      
      if (!res.ok) throw new Error("Backend error");
      
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: data.answer,
        sources: data.source_chunks || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: "❌ Couldn't get an answer. Make sure your backend is running!" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-yellow-50 to-amber-50">
      
      {/* Header */}
      <header className="h-16 bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg flex items-center px-6 shrink-0">
        <span className="text-3xl mr-3">✨</span>
        <h1 className="text-2xl font-bold text-amber-900">YAP ENGINE</h1>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Document History */}
        <aside className="w-64 bg-white border-r border-amber-200 flex flex-col shrink-0">
          
          {/* Upload Button */}
          <label className={`m-4 py-3 rounded-xl font-semibold text-center cursor-pointer
            bg-gradient-to-r from-yellow-400 to-amber-400 text-amber-900
            hover:from-yellow-500 hover:to-amber-500 shadow-lg hover:shadow-xl
            transition-all ${uploading ? "opacity-50 cursor-wait" : ""}`}>
            {uploading ? "⏳ Uploading..." : "📄 Upload PDF"}
            <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              onChange={handleUpload} 
              disabled={uploading} 
            />
          </label>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto px-4">
            <h3 className="text-xs font-bold uppercase text-amber-700 mb-3">Documents</h3>
            {documents.length === 0 ? (
              <p className="text-sm text-amber-600 italic">No files yet</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setActivePdfUrl(doc.url);
                      setActivePdfName(doc.name);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all border-2
                      ${activePdfUrl === doc.url 
                        ? "bg-yellow-100 border-amber-400" 
                        : "bg-amber-50 border-transparent hover:bg-amber-100"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>📄</span>
                      <span className="text-sm truncate">{doc.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          {chunks > 0 && (
            <div className="p-4 border-t border-amber-200 bg-amber-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{chunks}</div>
                <div className="text-xs text-amber-700">Knowledge Chunks</div>
              </div>
            </div>
          )}
        </aside>

        {/* Center - Chat Area */}
        <section className="flex-1 flex flex-col min-w-0">
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="text-6xl mb-4">💬</div>
                  <h2 className="text-2xl font-bold text-amber-900 mb-2">Ready to Chat!</h2>
                  <p className="text-amber-700">Upload a PDF to start asking questions</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl shadow ${
                      msg.type === 'user' 
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-amber-900' 
                        : 'bg-white border-2 border-amber-200'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-amber-200">
                          <p className="text-xs font-semibold text-amber-700 mb-1">📚 Sources:</p>
                          {msg.sources.map((src, j) => (
                            <p key={j} className="text-xs text-amber-600 mt-1 italic">"{src}"</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border-2 border-amber-200 p-4 rounded-2xl shadow">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-amber-200">
            <div className="flex gap-3 max-w-3xl mx-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-amber-200 
                  focus:border-amber-400 focus:outline-none bg-amber-50
                  placeholder-amber-400"
                placeholder="Ask about your document..."
                disabled={loading || documents.length === 0}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading || documents.length === 0}
                className="px-6 py-3 rounded-xl font-semibold
                  bg-gradient-to-r from-yellow-400 to-amber-400 text-amber-900
                  hover:from-yellow-500 hover:to-amber-500
                  shadow-lg hover:shadow-xl transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="text-xl">➤</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Panel - PDF Viewer */}
        <aside className="w-[500px] bg-white border-l border-amber-200 flex flex-col shrink-0 hidden lg:flex">
          
          {/* PDF Header */}
          <div className="h-14 bg-amber-100 border-b border-amber-200 flex items-center px-4">
            <span className="text-xl mr-2">📄</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-900">Source Context</h3>
              {activePdfName && (
                <p className="text-xs text-amber-700 truncate">{activePdfName}</p>
              )}
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 relative bg-gray-100">
            {activePdfUrl ? (
              <iframe 
                src={activePdfUrl} 
                className="w-full h-full border-none" 
                title="PDF Viewer"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-amber-600 p-8 text-center">
                <div className="text-6xl mb-4">👁️</div>
                <h3 className="text-xl font-bold mb-2">No PDF Selected</h3>
                <p className="text-sm">Upload a PDF to view it here instantly</p>
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}