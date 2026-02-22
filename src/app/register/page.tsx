"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement registration
    setTimeout(() => setIsLoading(false), 1500);
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
          <h1 className="text-2xl font-bold mt-6">Create your account</h1>
          <p className="text-muted-foreground mt-1">Start your trading journey today</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {step > 1 ? <Check className="h-4 w-4" /> : "1"}
          </div>
          <div className={cn(
            "w-16 h-1 rounded",
            step >= 2 ? "bg-primary" : "bg-muted"
          )} />
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            2
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Mobile</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+91 9999999999"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a strong password"
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

              <div>
                <label className="text-sm font-medium mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="rounded border-border mt-1"
                  required
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-lg font-medium transition-colors border border-border hover:bg-muted"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
