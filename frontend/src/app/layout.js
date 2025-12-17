import "./globals.css";

export const metadata = {
  title: "YAP ENGINE",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* FIXED HEADER */}
        <header className="h-14 flex items-center px-6 font-extrabold tracking-widest
          bg-gradient-to-r from-[#FFD70D] to-[#FFB300]
          shadow-[var(--glow-soft)]">
          ✨ YAP ENGINE
        </header>

        {/* PAGE CONTENT */}
        <main className="h-[calc(100vh-56px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
