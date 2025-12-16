"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Upload, Sparkles, User } from "lucide-react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hi! I'm Yap-Engine. 🍊 Feed me a PDF and let's chat!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  // REPLACE WITH YOUR RENDER URL
  const API_URL = "https://yap-engine.onrender.com";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      setMessages(prev => [...prev, { role: "ai", content: `📂 Got it! "${file.name}" is ready.` }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "❌ Brain is sleeping. Try again in 1 min." }]);
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
      setMessages(prev => [...prev, { role: "ai", content: "⚠️ Error connecting." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4 font-sans text-[#4C1C00]">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-6 p-4 bg-[#FFFAC1] rounded-3xl shadow-sm border border-[#FFE83A]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFB300] rounded-full shadow-md">
            <Sparkles className="w-6 h-6 text-[#4C1C00]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Yap-Engine</h1>
            <p className="text-xs font-medium opacity-70">The Sunny Document Reader</p>
          </div>
        </div>
        
        <label className={`flex items-center gap-2 px-5 py-2.5 bg-[#4C1C00] text-[#FFFDE9] rounded-2xl cursor-pointer hover:bg-[#6D2E00] transition-all shadow-lg ${uploading ? "opacity-50" : ""}`}>
          <Upload className="w-4 h-4" />
          <span className="text-sm font-bold">{uploading ? "Reading..." : "Upload PDF"}</span>
          <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
        </label>
      </header>

      {/* Chat Box */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 ${
              msg.role === "ai" ? "bg-[#FFFAC1] border border-[#FFE83A]" : "bg-[#EF8700]"
            }`}>
              {msg.role === "ai" ? <Sparkles className="w-5 h-5 text-[#EF8700]" /> : <User className="w-5 h-5 text-[#FFFDE9]" />}
            </div>

            {/* Bubble */}
            <div className={`p-4 rounded-3xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
              msg.role === "ai" 
                ? "bg-white border border-[#FFFAC1] text-[#4C1C00] rounded-tl-none" 
                : "bg-[#EF8700] text-[#FFFDE9] rounded-tr-none"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-center text-xs opacity-50 animate-pulse">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask something..."
          className="w-full p-5 pr-16 bg-white border-2 border-[#FFFAC1] rounded-3xl focus:outline-none focus:border-[#FFB300] focus:ring-4 focus:ring-[#FFFAC1] transition-all placeholder-[#4C1C00]/30 shadow-sm text-[#4C1C00]"
        />
        <button 
          onClick={sendMessage}
          disabled={!input.trim()}
          className="absolute right-3 top-3 p-2.5 bg-[#FFB300] hover:bg-[#EF8700] text-[#4C1C00] rounded-2xl transition-all disabled:opacity-0 disabled:scale-75"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}