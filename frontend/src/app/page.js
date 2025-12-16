"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Upload, FileText, Menu, X, Bot, User } from "lucide-react";

export default function Home() {
  // State
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I've read your documents. What do you need to know? 📚" },
  ]);
  const [documents, setDocuments] = useState([]); // Stores list of uploaded files
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For mobile toggle
  const messagesEndRef = useRef(null);

  // ⚠️ REPLACE WITH YOUR ACTUAL RENDER URL
  const API_URL = "https://yap-engine-backend.onrender.com";

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Handle File Upload
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      
      // Add to sidebar list
      setDocuments(prev => [...prev, file.name]);
      
      setMessages(prev => [...prev, { role: "ai", content: `✅ Successfully analyzed **${file.name}**. Ask me anything!` }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "❌ Error: Could not read file. Is the backend awake?" }]);
    } finally {
      setUploading(false);
    }
  };

  // Handle Chat Message
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
      
      {/* 📱 Mobile Menu Button */}
      <button 
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-[#FFFDF0] rounded-lg shadow-sm"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* 📂 LEFT SIDEBAR (Documents) */}
      <div className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative z-40 w-72 h-full bg-[#FFFDF0] border-r border-yellow-100 transition-transform duration-300 flex flex-col p-6`}>
        
        {/* Logo Area */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center shadow-sm">
            <Bot className="text-[#4A3B00] w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Yap-Engine</h1>
        </div>

        {/* Upload Button */}
        <label className={`flex items-center justify-center gap-2 w-full p-4 bg-[#3C2A21] text-[#FFFDF0] rounded-2xl cursor-pointer hover:bg-[#5D4037] transition-all shadow-md active:scale-95 ${uploading ? "opacity-70" : ""}`}>
          <Upload className="w-5 h-5" />
          <span className="font-semibold">{uploading ? "Reading..." : "Upload PDF"}</span>
          <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
        </label>

        {/* Document List */}
        <div className="mt-8 flex-1 overflow-y-auto">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Your Documents</h2>
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="text-sm text-gray-400 italic">No files uploaded yet.</div>
            ) : (
              documents.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-yellow-50 hover:border-yellow-200 transition-colors cursor-pointer">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <FileText className="w-4 h-4 text-[#FFD700]" />
                  </div>
                  <span className="text-sm font-medium truncate">{doc}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-yellow-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-200"></div>
            <div className="text-sm">
              <p className="font-bold">Student User</p>
              <p className="text-xs text-gray-400">Free Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* 💬 MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full relative bg-white">
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "ai" ? "bg-[#FFFDF0] border border-yellow-100" : "bg-[#FFD700]"
              }`}>
                {msg.role === "ai" ? <Bot className="w-4 h-4 text-yellow-600" /> : <User className="w-4 h-4 text-[#4A3B00]" />}
              </div>

              {/* Bubble */}
              <div className={`p-6 rounded-3xl text-[15px] leading-7 shadow-sm ${
                msg.role === "ai" 
                  ? "bg-[#FFFDF0] text-[#4A3B00] rounded-tl-none border border-yellow-50" 
                  : "bg-[#FFD700] text-[#4A3B00] font-medium rounded-tr-none"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 ml-14">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: "0s"}}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-10 bg-white">
          <div className="max-w-3xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a question about your documents..."
              className="w-full p-5 pr-16 bg-white border border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all placeholder-gray-300"
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim()}
              className="absolute right-3 top-3 p-2.5 bg-[#FFD700] hover:bg-[#F0C000] text-[#4A3B00] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-300 mt-4">Yap-Engine can make mistakes. Verify important info.</p>
        </div>

      </div>
    </div>
  );
}