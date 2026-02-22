"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Registration is disabled - Single Admin System
export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login after showing message
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <h1 className="text-xl font-bold">Registration Disabled</h1>
        <p className="text-muted-foreground">
          This is a single-admin system. Registration is not available.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to login...
        </p>
      </div>
    </div>
  );
}
