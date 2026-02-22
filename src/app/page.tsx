"use client";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { ErrorBoundary, DashboardErrorBoundary } from "@/components/ui/error-boundary";

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <DashboardErrorBoundary>
              <DashboardContent />
            </DashboardErrorBoundary>
          </main>
        </div>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
