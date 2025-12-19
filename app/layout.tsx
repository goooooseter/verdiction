import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"; // <--- 1. Импорт

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Verdiction MVP",
  description: "AI Justice System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        {children}
        {/* 2. Добавляем сам компонент уведомлений. theme="dark" для нашего стиля */}
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
