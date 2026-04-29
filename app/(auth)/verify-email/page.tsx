"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Info, Mail, Shield } from "lucide-react";
import { resendVerificationEmail, verifySignupCode } from "@/features/auth";

const C = {
  darkest: "#0F2210",
  dark: "#1A3A1A",
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  white: "#FFFFFF",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
  whisper: "#E8F5E8",
} as const;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const requestedRedirect = useMemo(
    () => searchParams.get("redirect") || undefined,
    [searchParams]
  );

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    "Enter the verification code sent to your email."
  );

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Missing email. Please return to registration and try again.");
      return;
    }
    if (!code.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }

    setIsVerifying(true);
    setError("");
    setMessage("");

    const result = await verifySignupCode(email, code.trim(), {
      requestedRedirect,
    });

    if (result.success) {
      router.push(result.redirectTo || "/");
      return;
    }

    setError(result.error || "Verification failed. Please try again.");
    setIsVerifying(false);
  };

  const handleResend = async () => {
    if (!email) {
      setError("Missing email. Please return to registration and try again.");
      return;
    }

    setIsResending(true);
    setError("");
    setMessage("");

    const result = await resendVerificationEmail(email);
    if (result.success) {
      setMessage(result.message || "Verification code sent. Check your inbox.");
    } else {
      setError(result.error || "Could not resend code right now.");
    }
    setIsResending(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(155deg, ${C.darkest}, #0B160B 52%, ${C.dark})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          background: C.white,
          borderRadius: 18,
          border: `1px solid ${C.borderSubtle}`,
          boxShadow: "0 22px 60px rgba(0,0,0,0.32)",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.medium}, ${C.primary})` }} />
        <div style={{ padding: "28px 24px 24px" }}>
          <h1 style={{ margin: 0, fontSize: 26, color: C.text, letterSpacing: "-0.5px" }}>Verify your email</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
            Confirm your account to continue to the portal.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, color: C.textSec, background: C.whisper, border: `1px solid ${C.border}`, borderRadius: 100, padding: "6px 10px" }}>
            <Mail size={13} color={C.textMuted} />
            {email || "No email provided"}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${C.borderSubtle}`, padding: "22px 24px 26px", display: "flex", flexDirection: "column", gap: 12 }}>
          {message && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: C.whisper, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: C.primary }}>
              <CheckCircle2 size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              {message}
            </div>
          )}

          {error && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#B91C1C" }}>
              <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter verification code"
              disabled={isVerifying}
              style={{ flex: 1, height: 48, borderRadius: 10, border: `1.5px solid ${C.border}`, padding: "0 12px", fontSize: 14, color: C.text, outline: "none" }}
            />
            <button
              type="submit"
              disabled={isVerifying}
              style={{ height: 48, padding: "0 14px", borderRadius: 10, border: "none", background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 13, fontWeight: 700, cursor: isVerifying ? "not-allowed" : "pointer", opacity: isVerifying ? 0.7 : 1 }}
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isVerifying}
            style={{ border: "none", background: "transparent", color: C.primary, textDecoration: "underline", fontSize: 12, fontWeight: 700, padding: 0, width: "fit-content", cursor: isResending || isVerifying ? "not-allowed" : "pointer", opacity: isResending || isVerifying ? 0.7 : 1 }}
          >
            {isResending ? "Sending new code..." : "Resend code"}
          </button>

          <div style={{ marginTop: 6, paddingTop: 12, borderTop: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textMuted }}>
            <Shield size={12} />
            Secure verification - redirected automatically on success
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: C.darkest }} />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
