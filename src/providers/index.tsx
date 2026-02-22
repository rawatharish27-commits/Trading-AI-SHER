"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ToastContextProvider } from "@/components/ui/use-toast";
import { AuthProvider } from "./AuthProvider";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 2,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastContextProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastContextProvider>
    </QueryClientProvider>
  );
}
