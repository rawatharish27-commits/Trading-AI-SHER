"use client";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { OrderForm } from "@/components/orders/OrderForm";
import { OrderList } from "@/components/orders/OrderList";

export default function OrdersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="space-y-6">
            <OrderForm />
            <OrderList />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
