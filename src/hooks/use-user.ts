"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database.types";
import type { UserRole } from "@/lib/contracts/status";

interface UseUserReturn {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isAuthenticated: boolean;
}

/**
 * Client-side hook to get current authenticated user and profile
 * 
 * Usage:
 * ```tsx
 * const { user, profile, loading, hasRole } = useUser();
 * 
 * if (loading) return <Skeleton />;
 * if (!user) return <SignInPrompt />;
 * if (!hasRole('super_admin')) return <Unauthorized />;
 * ```
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        setUser(user);

        if (user) {
          // Fetch profile
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (profileError) throw profileError;

          setProfile(profile);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch user"));
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch updated profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        setProfile(profile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!profile) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(profile.role);
  };

  return {
    user,
    profile,
    loading,
    error,
    hasRole,
    isAuthenticated: !!user,
  };
}
