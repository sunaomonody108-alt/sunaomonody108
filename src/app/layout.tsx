import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "台本練習ツール",
  description: "AI音声で台本のセリフを練習できるWebアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 antialiased">
        <SessionProvider>
          <Header />
          <main className="container mx-auto max-w-5xl px-4 py-8">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
