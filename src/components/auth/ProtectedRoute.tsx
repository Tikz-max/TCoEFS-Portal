"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { PageLoading } from "@/components/ui";
import type { UserRole } from "@/lib/contracts/status";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * Protected Route Wrapper
 * 
 * Protects client-side routes by checking authentication and role
 * 
 * Usage:
 * ```tsx
 * <ProtectedRoute requiredRoles={['super_admin']}>
 *   <SuperAdminDashboard />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = "/login",
  loadingComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, profile, loading, hasRole } = useUser();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo);
      } else if (requiredRoles && !hasRole(requiredRoles)) {
        // Redirect to appropriate dashboard based on role
        const roleRedirects: Record<string, string> = {
          super_admin: "/admin/dashboard",
          admin: "/admin/dashboard",
          admissions_officer: "/admin/dashboard",
          training_coordinator: "/admin/dashboard",
          e_learning_coordinator: "/admin/elearning",
          instructor: "/admin/elearning",
          participant: "/applicant/dashboard",
        };
        
        const userRedirect = profile ? roleRedirects[profile.role] : "/";
        router.push(userRedirect || "/");
      }
    }
  }, [loading, user, profile, requiredRoles, hasRole, router, redirectTo]);

  if (loading) {
    return loadingComponent || (
      <PageLoading title="Checking your portal access…" message="Confirming your session and opening the right workspace." />
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return null;
  }

  return <>{children}</>;
}

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Require Auth - simpler version that only checks authentication
 * 
 * Usage:
 * ```tsx
 * <RequireAuth>
 *   <Dashboard />
 * </RequireAuth>
 * ```
 */
export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return fallback || (
      <PageLoading title="Checking your portal access…" message="Confirming your session before opening the dashboard." />
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
