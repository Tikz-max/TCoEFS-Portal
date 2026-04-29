"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";

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

export default function ResetPasswordPage() {
  const requestedRedirect = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    return redirect && redirect.startsWith("/") ? redirect : null;
  }, []);

  const loginHref = requestedRedirect
    ? `/login?redirect=${encodeURIComponent(requestedRedirect)}`
    : "/login";

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsLoading(true);
    setIsLoading(false);
    setIsDone(true);
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
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.whisper, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <ShieldCheck size={18} color={C.primary} />
          </div>
          <h1 style={{ margin: 0, fontSize: 26, color: C.text, letterSpacing: "-0.5px" }}>
            {isDone ? "Password Updated" : "Reset Password"}
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
            {isDone
              ? "Your account password has been successfully updated."
              : "Choose a strong new password for your portal account."}
          </p>
        </div>

        <div style={{ borderTop: `1px solid ${C.borderSubtle}`, padding: "22px 24px 26px" }}>
          {isDone ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px", borderRadius: 10, background: "#F0FDF4", border: "1px solid #86EFAC", color: "#166534", fontSize: 12 }}>
                <CheckCircle2 size={15} style={{ marginTop: 1, flexShrink: 0 }} />
                Password reset successful. You can now sign in with your new credentials.
              </div>
              <Link
                href={loginHref}
                style={{ height: 48, borderRadius: 10, border: "none", background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}
              >
                Sign In
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label htmlFor="new-password" style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textSec, marginBottom: 6 }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color={C.textMuted} style={{ position: "absolute", left: 14, top: 16 }} />
                  <input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ width: "100%", height: 50, borderRadius: 10, border: `1.5px solid ${C.border}`, padding: "0 44px 0 42px", fontSize: 14, color: C.text, outline: "none" }}
                  />
                  <button type="button" onClick={() => setShowNew((s) => !s)} style={{ position: "absolute", right: 12, top: 13, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer" }}>
                    {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textSec, marginBottom: 6 }}>
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color={C.textMuted} style={{ position: "absolute", left: 14, top: 16 }} />
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ width: "100%", height: 50, borderRadius: 10, border: `1.5px solid ${C.border}`, padding: "0 44px 0 42px", fontSize: 14, color: C.text, outline: "none" }}
                  />
                  <button type="button" onClick={() => setShowConfirm((s) => !s)} style={{ position: "absolute", right: 12, top: 13, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer" }}>
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && <div style={{ fontSize: 12, color: "#B91C1C" }}>{error}</div>}

              <button
                type="submit"
                disabled={isLoading}
                style={{ height: 50, borderRadius: 10, border: "none", background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Updating password...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <Link href={loginHref} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textMuted, textDecoration: "none", fontWeight: 600 }}>
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
