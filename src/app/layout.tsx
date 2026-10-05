import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { parseLang, UI_LANG_COOKIE } from "@/lib/i18n";
import "@xyflow/react/dist/style.css";
import "./globals.css";

// cyrillic-ext нужен для казахских букв (ә, ғ, қ, ң, ө, ұ, ү, һ, і).
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic", "cyrillic-ext"] });

export const metadata: Metadata = {
  title: "KEU Bot — конструктор",
  description: "Визуальная настройка Telegram-бота Карагандинского университета Казпотребсоюза",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = parseLang((await cookies()).get(UI_LANG_COOKIE)?.value);
  return (
    <html lang={lang} className={`${inter.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
