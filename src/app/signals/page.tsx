"use client";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { SignalList } from "@/components/signals/SignalList";

export default function SignalsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <SignalList />
        </main>
      </div>
      <Footer />
    </div>
  );
}
