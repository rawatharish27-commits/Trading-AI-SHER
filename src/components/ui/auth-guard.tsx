"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Routes that don't require authentication (single admin - no registration)
const publicRoutes = ["/login", "/register"];

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      if (typeof window === "undefined") return null;

      const token = localStorage.getItem("accessToken");
      const tokenExpiry = localStorage.getItem("tokenExpiry");

      if (!token) {
        return false;
      }

      // Check if token is expired
      if (tokenExpiry) {
        const expiryDate = new Date(tokenExpiry);
        if (expiryDate < new Date()) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("tokenExpiry");
          return false;
        }
      }

      return true;
    };

    const auth = checkAuth();
    setIsAuthenticated(auth);

    // Redirect to login if not authenticated and trying to access protected route
    if (auth === false && !publicRoutes.includes(pathname)) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If on public route, always show content
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // If authenticated, show content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show loading while redirecting
  return fallback || (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Hook to get current user
export function useAuth() {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      if (typeof window === "undefined") return;

      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return { user, isLoading, logout, isAuthenticated: !!user };
}

// Role-based access control
export function useRole(requiredRole: string | string[]) {
  const { user } = useAuth();
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!user) {
    return { hasRole: false, user: null };
  }

  return {
    hasRole: roles.includes(user.role),
    user,
  };
}

// Component to protect routes by role
interface RoleGuardProps {
  children: React.ReactNode;
  role: string | string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, role, fallback }: RoleGuardProps) {
  const { hasRole } = useRole(role);

  if (!hasRole) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
