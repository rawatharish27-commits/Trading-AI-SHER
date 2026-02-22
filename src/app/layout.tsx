import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <div className="min-h-screen flex flex-col bg-background text-foreground">
              {children}
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
