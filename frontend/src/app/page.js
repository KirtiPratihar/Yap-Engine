export default function Home() {
  return (
    <div className="h-full grid grid-cols-[260px_1fr_360px] overflow-hidden">

      {/* LEFT PANEL */}
      <aside className="bg-[var(--bg-panel)] p-4 overflow-y-auto
        border-r border-[var(--border)]">
        
        <button
          className="w-full py-2 mb-4 rounded-lg font-semibold
          bg-[var(--accent)]
          shadow-[var(--glow-soft)]
          hover:bg-[var(--accent-hover)]
          transition">
          Upload PDF
        </button>

        <h3 className="text-sm font-bold mb-2">History</h3>
        <ul className="space-y-2 text-sm">
          <li className="truncate cursor-pointer hover:underline">
            Document_1.pdf
          </li>
          <li className="truncate cursor-pointer hover:underline">
            Document_2.pdf
          </li>
        </ul>
      </aside>

      {/* CHAT PANEL */}
      <section className="flex flex-col overflow-hidden">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="max-w-[70%] ml-auto p-3 rounded-xl
            bg-[var(--accent)]
            shadow-[var(--glow-soft)]
            break-words">
            User message goes here
          </div>

          <div className="max-w-[70%] p-3 rounded-xl bg-white
            shadow-md break-words">
            AI response from RAG goes here
          </div>
        </div>

        {/* Input (FIXED, NO OVERFLOW) */}
        <div className="p-3 border-t border-[var(--border)] flex gap-2">
          <input
            className="flex-1 px-4 py-2 rounded-xl outline-none"
            placeholder="Type a message..."
          />
          <button
            className="px-4 rounded-xl bg-[var(--accent-strong)]
            shadow-[var(--glow-strong)]">
            ➤
          </button>
        </div>
      </section>

      {/* RIGHT PANEL — SOURCE VIEWER (FIXED) */}
      <aside className="bg-white p-4 overflow-y-auto
        border-l border-[var(--border)]">
        <h3 className="font-bold mb-2">Source Viewer</h3>

        <div className="text-sm leading-relaxed">
          PDF content will appear here.
          Highlighted text can be added later.
        </div>
      </aside>

    </div>
  );
}
