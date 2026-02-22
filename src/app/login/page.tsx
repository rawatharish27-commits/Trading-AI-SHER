"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  
  const { login, isLoading, error, clearError } = useAuthStore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(formData.email, formData.password);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
        variant: "success",
      });
      router.push(redirect);
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">S</span>
            </div>
            <span className="font-bold text-3xl">SHER</span>
          </Link>
          <h1 className="text-2xl font-bold mt-6">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="trader@sher.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm text-muted-foreground">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              isLoading && "opacity-70 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
