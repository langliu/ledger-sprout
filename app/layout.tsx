import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { getToken } from "@/lib/auth-server";
import { TooltipProvider } from "@/components/ui/tooltip"

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "账芽",
  description: "账芽 · 慢慢记，慢慢长",
  icons: {
    icon: "/site-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();

  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider initialToken={token ?? null}>
          <TooltipProvider>{children}</TooltipProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
