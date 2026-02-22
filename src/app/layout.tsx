import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading AI SHER - Intelligent Trading Platform",
  description: "AI-powered trading signals and portfolio management",
  keywords: ["trading", "AI", "signals", "portfolio", "investments"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
