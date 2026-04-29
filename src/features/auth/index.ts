"use server";

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/contracts/status";
import { sendEmailWithResend } from "@/lib/email/resend";
import { buildAuthEmailTemplate } from "@/lib/email/auth-templates";

/**
 * Auth Server Actions
 * 
 * These actions handle authentication flow including:
 * - Sign in with email/password
 * - Sign up with profile creation
 * - Sign out
 * - Password reset
 */

export interface SignInResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

interface AuthRedirectOptions {
  requestedRedirect?: string | null;
}

function normalizeRequestedRedirect(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value === "/applicant") return "/applicant/dashboard";
  if (value === "/training") return "/training/dashboard";
  if (value === "/elearning") return "/elearning/dashboard";
  return value;
}

function requiresCoordinatorApproval(role: UserRole) {
  return role === "training_coordinator" || role === "e_learning_coordinator";
}

export interface SignUpResult {
  success: boolean;
  error?: string;
  message?: string;
  redirectTo?: string;
}

export interface ResendVerificationResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface VerifySignupResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string,
  options: AuthRedirectOptions = {}
): Promise<SignInResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Authentication failed. Please try again.",
      };
    }

    // Fetch user profile to get role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role,verification_status")
      .eq("user_id", data.user.id)
      .single<{ role: UserRole; verification_status: "pending" | "approved" }>();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Profile not found. Please contact support.",
      };
    }

    if (requiresCoordinatorApproval(profile.role) && profile.verification_status !== "approved") {
      await supabase.auth.signOut();
      return {
        success: false,
        error:
          "Your coordinator account is pending verification. Please wait for an admin approval email before signing in.",
      };
    }

    // Determine redirect based on role and registration intent
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

    const roleBasedRedirect =
      profile.role === "participant"
        ? participantRedirects[registrationIntent || "postgraduate"]
        : roleRedirects[profile.role as string] || "/";

    const requestedRedirect = normalizeRequestedRedirect(
      options.requestedRedirect
    );
    const redirectTo = requestedRedirect || roleBasedRedirect;

    return {
      success: true,
      redirectTo,
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Sign up new user with email, password, and role
 * Creates auth user + profile entry
 */
export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone: string | null,
  role: UserRole,
  registrationIntent: "postgraduate" | "training" | "elearning",
  options: AuthRedirectOptions = {}
): Promise<SignUpResult> {
  try {
    const startedAt = Date.now();
    console.log("[auth.signUp] start", { email, registrationIntent });

    const supabase = await createClient();
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;

    // Generate signup link (creates auth user if not existing)
    const generateLinkStartedAt = Date.now();
    const { data: generatedLink, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: {
          redirectTo: callbackUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
            registration_intent: registrationIntent,
          },
        },
      });
    console.log("[auth.signUp] admin.generateLink finished", {
      ms: Date.now() - generateLinkStartedAt,
      hasError: Boolean(linkError),
      hasUser: Boolean(generatedLink?.user),
      hasActionLink: Boolean(generatedLink?.properties?.action_link),
    });

    if (linkError || !generatedLink?.properties?.action_link) {
      console.error("[auth.signUp] admin.generateLink error", {
        message: linkError?.message,
        status: (linkError as any)?.status,
      });
      return {
        success: false,
        error: linkError?.message || "Could not generate verification email link.",
      };
    }

    const userId = generatedLink.user?.id;
    if (!userId) {
      return {
        success: false,
        error: "Could not create user account during signup.",
      };
    }

    const verificationTemplate = buildAuthEmailTemplate({
      actionType: "signup",
      recipientEmail: email,
      actionLink: generatedLink.properties.action_link,
      otpCode: generatedLink.properties.email_otp,
    });

    const sendEmailStartedAt = Date.now();
    const sentVerification = await sendEmailWithResend({
      to: email,
      subject: verificationTemplate.subject,
      html: verificationTemplate.html,
      text: verificationTemplate.text,
    });
    console.log("[auth.signUp] sendEmailWithResend finished", {
      ms: Date.now() - sendEmailStartedAt,
      success: sentVerification.success,
      error: sentVerification.error,
    });

    if (!sentVerification.success) {
      await adminClient.auth.admin.deleteUser(userId);
      return {
        success: false,
        error:
          sentVerification.error ||
          "Registration created, but verification email could not be sent.",
      };
    }

    // Create profile entry
    const profileInsertStartedAt = Date.now();
    const verificationStatus = requiresCoordinatorApproval(role)
      ? "pending"
      : "approved";

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      phone,
      role,
      verification_status: verificationStatus,
    } as any);
    console.log("[auth.signUp] profile insert finished", {
      ms: Date.now() - profileInsertStartedAt,
      hasError: Boolean(profileError),
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      await adminClient.auth.admin.deleteUser(userId);
      return {
        success: false,
        error: "Registration completed but profile creation failed. Please contact support.",
      };
    }

    console.log("[auth.signUp] success", {
      totalMs: Date.now() - startedAt,
      email,
      registrationIntent,
    });

    return {
      success: true,
      redirectTo:
        normalizeRequestedRedirect(options.requestedRedirect)
          ? normalizeRequestedRedirect(options.requestedRedirect)!
          : registrationIntent === "training"
          ? "/training/dashboard"
          : registrationIntent === "elearning"
            ? "/elearning/dashboard"
            : "/applicant/dashboard",
      message: "Registration successful! Please check your email to verify your account.",
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<SignUpResult> {
  try {
    const startedAt = Date.now();
    console.log("[auth.resetPassword] start", { email });

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      },
    });
    console.log("[auth.resetPassword] admin.generateLink finished", {
      ms: Date.now() - startedAt,
      hasError: Boolean(error),
      hasActionLink: Boolean(data?.properties?.action_link),
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data?.properties?.action_link) {
      return {
        success: false,
        error: "Could not generate reset email link.",
      };
    }

    const resetTemplate = buildAuthEmailTemplate({
      actionType: "recovery",
      recipientEmail: email,
      actionLink: data.properties.action_link,
      otpCode: data.properties.email_otp,
    });

    const sentResetEmail = await sendEmailWithResend({
      to: email,
      subject: resetTemplate.subject,
      html: resetTemplate.html,
      text: resetTemplate.text,
    });
    console.log("[auth.resetPassword] sendEmailWithResend finished", {
      totalMs: Date.now() - startedAt,
      success: sentResetEmail.success,
      error: sentResetEmail.error,
    });

    if (!sentResetEmail.success) {
      return {
        success: false,
        error: sentResetEmail.error || "Failed to send password reset email.",
      };
    }

    return {
      success: true,
      message: "Password reset email sent. Please check your inbox.",
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Resend account verification email
 */
export async function resendVerificationEmail(
  email: string
): Promise<ResendVerificationResult> {
  try {
    const startedAt = Date.now();
    console.log("[auth.resendVerification] start", { email });

    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
      },
    });
    console.log("[auth.resendVerification] admin.generateLink finished", {
      ms: Date.now() - startedAt,
      hasError: Boolean(error),
      hasActionLink: Boolean(data?.properties?.action_link),
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data?.properties?.action_link) {
      return {
        success: false,
        error: "Could not generate verification link.",
      };
    }

    const resendTemplate = buildAuthEmailTemplate({
      actionType: "magiclink",
      recipientEmail: email,
      actionLink: data.properties.action_link,
      otpCode: data.properties.email_otp,
    });

    const sentEmail = await sendEmailWithResend({
      to: email,
      subject: resendTemplate.subject,
      html: resendTemplate.html,
      text: resendTemplate.text,
    });
    console.log("[auth.resendVerification] sendEmailWithResend finished", {
      totalMs: Date.now() - startedAt,
      success: sentEmail.success,
      error: sentEmail.error,
    });

    if (!sentEmail.success) {
      return {
        success: false,
        error: sentEmail.error || "Unable to send verification email.",
      };
    }

    return {
      success: true,
      message: "Verification email sent. Please check your inbox.",
    };
  } catch (error) {
    console.error("Resend verification error:", error);
    return {
      success: false,
      error: "Unable to resend verification email right now.",
    };
  }
}

/**
 * Verify signup OTP code and create authenticated session
 */
export async function verifySignupCode(
  email: string,
  code: string,
  options: AuthRedirectOptions = {}
): Promise<VerifySignupResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Verification succeeded, but user session was not created.",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role,verification_status")
      .eq("user_id", data.user.id)
      .single<{ role: UserRole; verification_status: "pending" | "approved" }>();

    if (
      profile &&
      requiresCoordinatorApproval(profile.role) &&
      profile.verification_status !== "approved"
    ) {
      await supabase.auth.signOut();
      return {
        success: false,
        error:
          "Your coordinator account is pending verification. Please wait for an admin approval email before signing in.",
      };
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

    const roleBasedRedirect =
      profile?.role === "participant"
        ? participantRedirects[registrationIntent || "postgraduate"]
        : roleRedirects[profile?.role || ""] || "/";

    const requestedRedirect = normalizeRequestedRedirect(
      options.requestedRedirect
    );
    const redirectTo = requestedRedirect || roleBasedRedirect;

    return {
      success: true,
      redirectTo,
    };
  } catch (error) {
    console.error("Verify signup code error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during verification.",
    };
  }
}

/**
 * Update user password (used after reset link click)
 */
export async function updatePassword(newPassword: string): Promise<SignUpResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Password updated successfully.",
    };
  } catch (error) {
    console.error("Password update error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get current user session and profile
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return {
    user,
    profile,
  };
}
