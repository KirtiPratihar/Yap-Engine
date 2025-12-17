"use client";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Upload,
  FileText,
  User,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "🌋 Welcome to Yap-Engine. Upload a PDF and let’s explore it together." },
  ]);
  const [documents, setDocuments] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const messagesEndRef = useRef(null);
  const API_URL = "https://yap-engine-backend.onrender.com";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      const doc = { name: file.name, date: new Date().toLocaleTimeString() };
      setDocuments((p) => [...p, doc]);
      setSelectedDoc(doc);
      setMessages((p) => [...p, { role: "ai", content: `✨ **${file.name}** is ready.` }]);
    } catch {
      setMessages((p) => [...p, { role: "ai", content: "⚠️ Upload failed." }]);
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const question = input;
    setInput("");
    setMessages((p) => [...p, { role: "user", content: question }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { role: "ai", content: data.answer }]);
    } catch {
      setMessages((p) => [...p, { role: "ai", content: "⚠️ Connection error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FFFDE9] text-[#4C1C00] overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-[300px] bg-gradient-to-b from-[#FFFAC1] to-[#FFF4AC] border-r border-[#C65C00]/20 shadow-soft flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFD70D] to-[#FFB300] flex items-center justify-center shadow-glow animate-float">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Yap-Engine</h1>
          </div>

          <label className="block">
            <div className="w-full py-4 rounded-2xl text-center font-bold bg-[#4C1C00] text-[#FFFDE9] cursor-pointer hover:shadow-glowHover hover:-translate-y-0.5 transition">
              {uploading ? "Ingesting…" : "Upload PDF"}
            </div>
            <input type="file" accept="application/pdf" hidden onChange={handleUpload} />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <p className="text-xs uppercase tracking-widest opacity-40 mb-4">History</p>
          {documents.map((d, i) => (
            <div
              key={i}
              onClick={() => setSelectedDoc(d)}
              className={`p-3 mb-2 rounded-xl cursor-pointer transition border ${
                selectedDoc?.name === d.name
                  ? "bg-white border-[#FFD70D] shadow-soft"
                  : "hover:bg-white/60 border-transparent"
              }`}
            >
              <p className="text-sm font-bold truncate">{d.name}</p>
              <p className="text-[10px] opacity-50">{d.date}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* CHAT */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-10 space-y-8">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex max-w-3xl mx-auto gap-4 animate-fadeUp ${
                m.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  m.role === "ai" ? "bg-[#FFFAC1]" : "bg-[#FFD70D]"
                }`}
              >
                {m.role === "ai" ? <Sparkles size={18} /> : <User size={18} />}
              </div>
              <div
                className={`px-6 py-4 rounded-3xl shadow-soft ${
                  m.role === "ai"
                    ? "bg-white"
                    : "bg-[#FFE83A] font-medium"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-center gap-2">
              <span className="w-2 h-2 bg-[#FFD70D] rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-[#FFD70D] rounded-full animate-bounce delay-100" />
              <span className="w-2 h-2 bg-[#FFD70D] rounded-full animate-bounce delay-200" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-[#C65C00]/10 bg-[#FFFDE9]/80 backdrop-blur">
          <div className="max-w-3xl mx-auto relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything…"
              className="w-full py-5 px-6 pr-16 rounded-3xl border-2 border-[#FFFAC1] focus:border-[#FFD70D] focus:ring-4 focus:ring-[#FFE83A]/50 shadow-soft"
            />
            <button
              onClick={sendMessage}
              className="absolute right-3 top-3 bg-[#FFD70D] p-3 rounded-2xl hover:bg-[#EF8700] transition shadow-soft"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>

      {/* SOURCE VIEWER */}
      <aside className="w-[360px] bg-[#FFFAC1] border-l border-[#C65C00]/20 shadow-soft hidden lg:flex flex-col">
        <div className="p-5 font-bold border-b">Source Viewer</div>
        <div className="p-6 text-sm">
          {selectedDoc ? (
            <mark className="bg-[#FFE83A] px-2 py-1 rounded">
              Highlighted source text will appear here.
            </mark>
          ) : (
            <p className="opacity-40 text-center mt-20">Select a document</p>
          )}
        </div>
      </aside>
    </div>
  );
}
