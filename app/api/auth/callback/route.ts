import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth Callback Route Handler
 * 
 * Handles Supabase Auth callback after:
 * - Email confirmation
 * - Password reset
 * - OAuth provider redirect
 * 
 * Exchanges code for session and redirects to appropriate dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    if (data.user) {
      // Fetch user profile to determine dashboard redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,verification_status")
        .eq("user_id", data.user.id)
        .single<{ role: string; verification_status: "pending" | "approved" }>();

      if (profile) {
        if (
          (profile.role === "training_coordinator" || profile.role === "e_learning_coordinator") &&
          profile.verification_status !== "approved"
        ) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?pending_verification=1`);
        }

        const roleRedirects: Record<string, string> = {
          super_admin: "/admin/dashboard",
          admin: "/admin/dashboard",
          admissions_officer: "/admin/dashboard",
          training_coordinator: "/admin/dashboard",
          e_learning_coordinator: "/admin/elearning",
          instructor: "/admin/elearning",
          participant: "/applicant/dashboard",
        };

        const registrationIntent = data.user.user_metadata?.registration_intent as
          | "postgraduate"
          | "training"
          | "elearning"
          | undefined;

        const participantRedirects: Record<string, string> = {
          postgraduate: "/applicant/dashboard",
          training: "/training/dashboard",
          elearning: "/elearning/dashboard",
        };

        const redirectTo =
          profile.role === "participant"
            ? participantRedirects[registrationIntent || "postgraduate"]
            : roleRedirects[profile.role as string] || next;
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }
    }
  }

  // Default redirect
  return NextResponse.redirect(`${origin}${next}`);
}
