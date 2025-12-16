import { Inter } from "next/font/google";
import "./globals.css"; // 👈 This imports your beautiful CSS

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Yap-Engine",
  description: "AI Document Reader",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}