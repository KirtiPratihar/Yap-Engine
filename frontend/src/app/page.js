"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Upload, FileText, Menu, X, Bot, User, Eye } from "lucide-react";

export default function Home() {
  // --- STATE ---
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I've read your documents. What do you need to know? 📚" },
  ]);
  const [documents, setDocuments] = useState([]); 
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null); // Tracks which doc is shown in Right Panel
  
  // Responsive Toggles
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true); 

  const messagesEndRef = useRef(null);

  // ⚠️ REPLACE WITH YOUR ACTUAL RENDER URL
  const API_URL = "https://yap-engine-backend.onrender.com";

  // --- EFFECTS ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // --- HANDLERS ---
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      
      setDocuments(prev => [...prev, file.name]);
      setSelectedDoc(file.name); // Auto-open the new doc in right panel
      setMessages(prev => [...prev, { role: "ai", content: `✅ Successfully analyzed **${file.name}**. Ask me anything!` }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "❌ Error: Could not read file. Is the backend awake?" }]);
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "⚠️ Connection error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white text-[#4A3B00] font-sans overflow-hidden">
      
      {/* 📱 Mobile Toggle: Left Sidebar */}
      <button 
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-[#FFFDF0] rounded-lg shadow-sm border border-yellow-200"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 📱 Mobile Toggle: Right Panel */}
      <button 
        className="xl:hidden absolute top-4 right-4 z-50 p-2 bg-[#FFFDF0] rounded-lg shadow-sm border border-yellow-200"
        onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
      >
        <Eye size={20} />
      </button>

      {/* 📂 LEFT PANEL (Sidebar) */}
      <aside className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative z-40 w-72 h-full bg-[#FFFDF0] border-r border-yellow-100 transition-transform duration-300 flex flex-col p-5`}>
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 pl-2">
          <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center shadow-sm">
            <Bot className="text-[#4A3B00] w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Yap-Engine</h1>
        </div>

        {/* Upload */}
        <label className={`flex items-center justify-center gap-2 w-full p-4 bg-[#3C2A21] text-[#FFFDF0] rounded-2xl cursor-pointer hover:bg-[#5D4037] transition-all shadow-md active:scale-95 ${uploading ? "opacity-70" : ""}`}>
          <Upload className="w-5 h-5" />
          <span className="font-semibold">{uploading ? "Reading..." : "Upload PDF"}</span>
          <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
        </label>

        {/* Doc List */}
        <div className="mt-8 flex-1 overflow-y-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 pl-2">Documents</p>
          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400 italic pl-2">No files yet.</p>
            ) : (
              documents.map((doc, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDoc(doc)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedDoc === doc ? "bg-[#FFD700] shadow-sm font-medium" : "hover:bg-yellow-50"}`}
                >
                  <FileText className="w-4 h-4 opacity-70" />
                  <span className="text-sm truncate">{doc}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* 💬 CENTER PANEL (Chat) */}
      <main className="flex-1 flex flex-col h-full relative bg-white min-w-0">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 max-w-2xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "ai" ? "bg-[#FFFDF0] border border-yellow-100" : "bg-[#FFD700]"
              }`}>
                {msg.role === "ai" ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-[15px] leading-7 shadow-sm ${
                msg.role === "ai" 
                  ? "bg-[#FFFDF0] text-[#4A3B00] rounded-tl-none border border-yellow-50" 
                  : "bg-[#FFD700] text-[#4A3B00] font-medium rounded-tr-none"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && <div className="text-sm text-gray-400 animate-pulse ml-14">Yap-Engine is thinking...</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-50 bg-white/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a question..."
              className="w-full p-4 pr-14 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:bg-white transition-all shadow-sm"
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim()}
              className="absolute right-2 top-2 p-2.5 bg-[#FFD700] hover:bg-[#F0C000] text-[#4A3B00] rounded-xl transition-all disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>

      {/* 👁️ RIGHT PANEL (Source Viewer) */}
      <aside className={`${isRightPanelOpen ? "translate-x-0" : "translate-x-full"} xl:translate-x-0 fixed xl:relative right-0 z-40 w-80 h-full bg-white border-l border-gray-100 transition-transform duration-300 flex flex-col shadow-xl xl:shadow-none`}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-700">Source Viewer</h2>
          <button onClick={() => setIsRightPanelOpen(false)} className="xl:hidden p-1 hover:bg-gray-100 rounded">
            <X size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {selectedDoc ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#4A3B00]">
                <FileText size={16} />
                {selectedDoc}
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-sm leading-relaxed text-gray-600">
                <p className="mb-2 text-xs font-bold text-yellow-600 uppercase">Excerpt</p>
                <p>
                  "Storage information schedule is established to determine priority of system resources..."
                </p>
                {/* FUTURE TODO: 
                   Once we add the backend feature to return "source text", 
                   we will display the actual highlighted text here!
                */}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Select a document to see source details here.</p>
            </div>
          )}
        </div>
      </aside>

    </div>
  );
}