"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Mail, Lock, Shield, AlertCircle } from "lucide-react";
import { signIn } from "@/features/auth";
import tcoefsLogo from "../../../tcoefs-logo.png";
import loginOverlayImage from "../../../portal_images/hand_holding_grains.jpeg";

const C = {
  darkest: "#0F2210",
  dark: "#1A3A1A",
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  pale: "#A8D4A8",
  whisper: "#E8F5E8",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [requestedRedirect, setRequestedRedirect] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    const pendingVerification = params.get("pending_verification");
    setRequestedRedirect(redirect && redirect.startsWith("/") ? redirect : null);
    if (pendingVerification === "1") {
      setError(
        "Your coordinator account is pending verification. You will receive an email once admin approval is complete."
      );
    }
  }, []);

  const registerHref = requestedRedirect
    ? `/register?redirect=${encodeURIComponent(requestedRedirect)}`
    : "/register";
  const forgotPasswordHref = requestedRedirect
    ? `/forgot-password?redirect=${encodeURIComponent(requestedRedirect)}`
    : "/forgot-password";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn(email, password, { requestedRedirect });

    if (result.success && result.redirectTo) {
      router.push(result.redirectTo);
      return;
    }

    setError(result.error || "Sign in failed. Please try again.");
    setIsLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: `radial-gradient(circle at 12% 10%, rgba(168,212,168,0.2), transparent 35%), linear-gradient(150deg, ${C.darkest}, #0B160B 50%, ${C.dark})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
        padding: "28px",
      }}
    >
      <style>{`
        .auth-login-shell {
          width: min(1080px, 100%);
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: 0 28px 80px rgba(0,0,0,0.35);
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(10px);
        }
        .auth-login-intro {
          position: relative;
          padding: 44px;
          border-right: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: rgba(255,255,255,0.9);
          overflow: hidden;
        }
        .auth-login-overlay {
          position: absolute;
          right: -28px;
          bottom: -22px;
          width: 64%;
          max-width: 420px;
          aspect-ratio: 4 / 5;
          border-radius: 30px;
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 32px 76px rgba(0,0,0,0.38);
          opacity: 0.48;
          transform: rotate(5deg);
        }
        .auth-login-overlay::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(15,34,16,0.08), rgba(15,34,16,0.74));
        }
        .auth-login-card {
          background: ${C.white};
          padding: 40px 36px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-input {
          width: 100%;
          height: 50px;
          border-radius: 10px;
          border: 1.5px solid ${C.border};
          padding: 0 14px 0 42px;
          font-size: 14px;
          color: ${C.text};
          outline: none;
        }
        .auth-input:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px rgba(45,90,45,0.12);
        }
        .auth-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: ${C.textSec};
          margin-bottom: 6px;
          display: block;
        }
        .auth-helper-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: center;
          margin-top: -2px;
        }
        @media (max-width: 940px) {
          .auth-login-shell { grid-template-columns: 1fr; }
          .auth-login-intro { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 28px; }
          .auth-login-overlay { width: 54%; right: -16px; bottom: -34px; opacity: 0.34; }
          .auth-login-card { padding: 30px 22px; }
        }
        @media (max-width: 480px) {
          .auth-login-shell {
            border-radius: 18px;
          }
          .auth-login-intro {
            padding: 18px;
            min-height: 174px;
          }
          .auth-login-intro h1 {
            font-size: 27px !important;
            line-height: 1.08 !important;
            letter-spacing: -0.7px !important;
            max-width: 310px;
          }
          .auth-login-intro p {
            font-size: 13px !important;
            line-height: 1.55 !important;
            max-width: 290px !important;
          }
          .auth-login-overlay {
            width: 44%;
            right: -28px;
            bottom: -44px;
            opacity: 0.18;
          }
          .auth-login-intro > div:last-child {
            display: none !important;
          }
          .auth-login-card {
            padding: 22px 16px 18px;
            gap: 14px;
          }
          .auth-login-card h2 {
            font-size: 23px !important;
          }
          .auth-input {
            height: 50px;
            font-size: 16px;
          }
          .auth-helper-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }
          .auth-helper-row button,
          .auth-helper-row a {
            min-height: 32px;
          }
        }
      `}</style>

      <div className="auth-login-shell">
        <section className="auth-login-intro" aria-hidden="true">
          <div className="auth-login-overlay" style={{ backgroundImage: `url(${loginOverlayImage.src})` }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img src={tcoefsLogo.src} alt="" style={{ width: 26, height: 26 }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>TCoEFS Portal</div>
              <div style={{ fontSize: 10, opacity: 0.58 }}>University of Jos</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", opacity: 0.54, marginBottom: 14 }}>
              Institutional Access
            </div>
            <h1 style={{ fontSize: 38, lineHeight: 1.05, margin: "0 0 14px", letterSpacing: "-1px" }}>
              Sign in to continue your academic journey.
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.68)", lineHeight: 1.7, maxWidth: 470 }}>
              Manage postgraduate applications, professional training registrations, and e-learning records in one secure portal.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.58 }}>
            <Shield size={12} />
            TETFund Centre of Excellence in Food Security
          </div>
        </section>

        <section className="auth-login-card">
          <div>
            <h2 style={{ margin: 0, fontSize: 26, color: C.text, letterSpacing: "-0.5px" }}>Portal Sign In</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
              Use your registered email and password.
            </p>
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 12,
                color: "#B91C1C",
              }}
            >
              <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="auth-label" htmlFor="login-email">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color={C.textMuted} style={{ position: "absolute", left: 14, top: 17 }} />
                <input
                  id="login-email"
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="auth-label" htmlFor="login-password">Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color={C.textMuted} style={{ position: "absolute", left: 14, top: 17 }} />
                <input
                  id="login-password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your secure password"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 13,
                    border: "none",
                    background: "transparent",
                    color: C.textMuted,
                    cursor: isLoading ? "not-allowed" : "pointer",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="auth-helper-row">
              <Link href={forgotPasswordHref} style={{ fontSize: 12, color: C.primary, textDecoration: "none", fontWeight: 600 }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 4,
                height: 50,
                borderRadius: 10,
                border: "none",
                background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`,
                color: C.white,
                fontWeight: 700,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              borderTop: `1px solid ${C.borderSubtle}`,
              paddingTop: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 13,
              color: C.textSec,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span>New to the portal?</span>
              <Link href={registerHref} style={{ color: C.primary, fontWeight: 700, textDecoration: "none" }}>
                Create participant account
              </Link>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12 }}>
              <Link href="/register/training-coordinator" style={{ color: C.primary, textDecoration: "none", fontWeight: 600 }}>
                Training coordinator signup
              </Link>
              <Link href="/register/elearning-coordinator" style={{ color: C.primary, textDecoration: "none", fontWeight: 600 }}>
                E-learning coordinator signup
              </Link>
            </div>
          </div>
        </section>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
