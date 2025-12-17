"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Upload, FileText, Bot, User, Sparkles, Trash2 } from "lucide-react";

export default function Home() {
  // --- STATE ---
  const [messages, setMessages] = useState([
    { role: "ai", content: "Ciao! 🌋 I am the Yap-Engine. Upload a PDF and I'll break it down for you." },
  ]);
  const [documents, setDocuments] = useState([]); // This stores your session history
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  const messagesEndRef = useRef(null);
  const API_URL = "https://yap-engine-backend.onrender.com"; // Your Render URL

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      
      // Add to History List
      const newDoc = { name: file.name, date: new Date().toLocaleTimeString() };
      setDocuments(prev => [...prev, newDoc]);
      setSelectedDoc(newDoc); // Auto-select new doc
      
      setMessages(prev => [...prev, { role: "ai", content: `🔥 **${file.name}** analyzed! I'm ready.` }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "❌ Error: My brain is disconnected. Check Render." }]);
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
    // MASTER CONTAINER: Forces 3 columns side-by-side
    <div className="flex flex-row h-screen w-full bg-[#FFFDE9] text-[#4C1C00] font-sans overflow-hidden">
      
      {/* --------------------------------------------------
          1. LEFT PANEL (History & Upload) - Fixed Width 280px
         -------------------------------------------------- */}
      <aside className="w-[280px] flex-shrink-0 bg-[#FFFAC1] border-r border-[#C65C00]/20 flex flex-col z-20 shadow-[4px_0_24px_rgba(198,92,0,0.05)]">
        
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFD70D] to-[#FFB300] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="text-[#4C1C00] w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Yap-Engine</h1>
          </div>

          {/* Upload Button */}
          <label className={`group flex items-center justify-center gap-2 w-full p-4 bg-[#4C1C00] text-[#FFFDE9] rounded-2xl cursor-pointer hover:bg-[#6D2E00] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 ${uploading ? "opacity-70" : ""}`}>
            <Upload className="w-5 h-5 group-hover:animate-bounce" />
            <span className="font-bold tracking-wide">{uploading ? "Ingesting..." : "Upload PDF"}</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
          </label>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          <h3 className="text-xs font-bold text-[#833904] opacity-50 uppercase tracking-widest mb-4 ml-2">History</h3>
          
          {documents.length === 0 ? (
            <div className="text-center mt-10 opacity-40">
              <FileText className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm font-medium">No documents yet</p>
            </div>
          ) : (
            documents.map((doc, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedDoc(doc)}
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedDoc?.name === doc.name ? "bg-white border-[#FFD70D] shadow-md" : "border-transparent hover:bg-white/50"}`}
              >
                <div className={`p-2 rounded-lg ${selectedDoc?.name === doc.name ? "bg-[#FFD70D]" : "bg-[#FFE83A]/30"}`}>
                  <FileText className="w-4 h-4 text-[#4C1C00]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{doc.name}</p>
                  <p className="text-[10px] opacity-60">{doc.date}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-[#C65C00]/10">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-full bg-[#EF8700] flex items-center justify-center text-white font-bold text-xs">SU</div>
            <div className="flex-1">
              <p className="text-xs font-bold">Student User</p>
              <p className="text-[10px] text-[#833904]">Online</p>
            </div>
          </div>
        </div>
      </aside>


      {/* --------------------------------------------------
          2. CENTER PANEL (Chat) - Flexible Width
         -------------------------------------------------- */}
      <main className="flex-1 flex flex-col h-full bg-[#FFFDE9] relative min-w-0">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white ${
                msg.role === "ai" ? "bg-[#FFFAC1]" : "bg-[#FFD70D]"
              }`}>
                {msg.role === "ai" ? <Sparkles size={18} className="text-[#EF8700]" /> : <User size={18} className="text-[#4C1C00]" />}
              </div>
              <div className={`p-5 rounded-3xl text-[15px] leading-relaxed shadow-sm max-w-[85%] ${
                msg.role === "ai" 
                  ? "bg-white text-[#4C1C00] rounded-tl-none border border-[#FFFAC1]" 
                  : "bg-[#FFE83A] text-[#4C1C00] font-medium rounded-tr-none border border-[#FFD70D]"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-center py-4">
              <div className="w-2 h-2 bg-[#FFD70D] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#FFD70D] rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-[#FFD70D] rounded-full animate-bounce delay-200"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-[#FFFDE9]/90 backdrop-blur-sm border-t border-[#C65C00]/10">
          <div className="max-w-3xl mx-auto relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything..."
              className="w-full p-5 pr-16 bg-white border-2 border-[#FFFAC1] rounded-3xl focus:outline-none focus:border-[#FFD70D] focus:ring-4 focus:ring-[#FFFAC1] transition-all shadow-lg shadow-[#FFD70D]/5 text-[#4C1C00] placeholder-[#4C1C00]/30"
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim()}
              className="absolute right-3 top-3 p-2.5 bg-[#FFD700] hover:bg-[#EF8700] text-[#4C1C00] rounded-2xl transition-all disabled:opacity-0 disabled:scale-75 shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>


      {/* --------------------------------------------------
          3. RIGHT PANEL (PDF Viewer) - Fixed Width 350px
         -------------------------------------------------- */}
      <aside className="w-[350px] flex-shrink-0 bg-[#FFFAC1] border-l border-[#C65C00]/20 flex flex-col shadow-[-4px_0_24px_rgba(198,92,0,0.05)]">
        
        <div className="p-5 border-b border-[#C65C00]/10 bg-[#FFFAC1]">
          <h2 className="font-bold text-[#833904] flex items-center gap-2">
            <FileText className="w-4 h-4"/> Source Viewer
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedDoc ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-6 p-4 bg-white rounded-xl border border-[#FFD70D] shadow-sm">
                 <h3 className="text-sm font-bold text-[#4C1C00] mb-1">Current Document</h3>
                 <p className="text-xs text-[#833904] opacity-70 break-all">{selectedDoc.name}</p>
              </div>
              
              <div className="prose prose-sm prose-p:text-[#4C1C00]">
                <p className="text-sm leading-relaxed p-4 bg-white rounded-xl border border-[#FFFAC1] shadow-sm">
                  <span className="block text-[10px] font-bold text-[#EF8700] uppercase mb-2">Live Extraction</span>
                   (Here we will display the exact text match from the PDF once we connect the "Source" backend feature.)
                  <br/><br/>
                  <mark className="bg-[#FFE83A] text-[#4C1C00] px-1 py-0.5 rounded font-medium">
                    "This text is highlighted to represent where the AI found its answer."
                  </mark>
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#833904]/40 text-center space-y-3">
              <div className="w-16 h-16 bg-[#FFFDE9] rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm font-medium px-6">Select a document from the left to view it here.</p>
            </div>
          )}
        </div>
      </aside>

    </div>
  );
}