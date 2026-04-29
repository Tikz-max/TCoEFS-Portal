"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, Info, Loader2, Mail, Shield, User, Users, Eye, EyeOff, Lock, Phone } from "lucide-react";
import { signUp } from "@/features/auth";
import type { UserRole } from "@/lib/contracts/status";
import tcoefsLogo from "../../../tcoefs-logo.png";
import registerOverlayImage from "../../../portal_images/tending_to_livestocks.jpeg";

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

type RegistrationTrack = "postgraduate" | "training" | "elearning";

export default function RegisterPage() {
  const router = useRouter();

  const [requestedRedirect, setRequestedRedirect] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RegistrationTrack>("postgraduate");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    setRequestedRedirect(redirect && redirect.startsWith("/") ? redirect : null);
  }, []);

  const loginHref = requestedRedirect
    ? `/login?redirect=${encodeURIComponent(requestedRedirect)}`
    : "/login";

  const roleConfig = useMemo(
    () => [
      {
        id: "postgraduate" as const,
        title: "Postgraduate Applicant",
        desc: "Apply for MSc, MPhil, and PhD pathways.",
        icon: <GraduationCap size={15} />,
      },
      {
        id: "training" as const,
        title: "Training Participant",
        desc: "Register for practical short courses and workshops.",
        icon: <Users size={15} />,
      },
      {
        id: "elearning" as const,
        title: "E-Learning Participant",
        desc: "Access online modules and certificate tracks.",
        icon: <BookOpen size={15} />,
      },
    ],
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const roleMap: Record<RegistrationTrack, UserRole> = {
      postgraduate: "participant",
      training: "participant",
      elearning: "participant",
    };

    const result = await signUp(
      email,
      password,
      firstName,
      lastName,
      phone || null,
      roleMap[selectedRole],
      selectedRole,
      { requestedRedirect }
    );

    if (result.success) {
      setSuccess(true);
      const params = new URLSearchParams({ email });
      if (result.redirectTo) params.set("redirect", result.redirectTo);
      router.push(`/verify-email?${params.toString()}`);
      return;
    }

    setError(result.error || "Registration failed. Please try again.");
    setIsLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: `radial-gradient(circle at 8% 10%, rgba(168,212,168,0.22), transparent 32%), linear-gradient(160deg, ${C.darkest}, #0A150A 52%, ${C.dark})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
        padding: "26px",
      }}
    >
      <style>{`
        .auth-register-shell {
          width: min(1180px, 100%);
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.02);
          box-shadow: 0 28px 80px rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
        }
        .auth-register-intro {
          position: relative;
          padding: 42px;
          border-right: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: rgba(255,255,255,0.9);
          overflow: hidden;
        }
        .auth-register-overlay {
          position: absolute;
          left: -36px;
          bottom: -26px;
          width: 68%;
          max-width: 430px;
          aspect-ratio: 4 / 5;
          border-radius: 34px;
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: 0 34px 88px rgba(0,0,0,0.4);
          opacity: 0.46;
          transform: rotate(-5deg);
        }
        .auth-register-overlay::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(15,34,16,0.06), rgba(15,34,16,0.72));
        }
        .auth-register-card {
          background: ${C.white};
          padding: 34px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .auth-input {
          width: 100%;
          height: 48px;
          border-radius: 10px;
          border: 1.5px solid ${C.border};
          padding: 0 14px 0 40px;
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
        .role-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          border: 1px solid ${C.border};
          border-radius: 10px;
          padding: 10px 12px;
          background: ${C.white};
          cursor: pointer;
          text-align: left;
          min-height: 58px;
          transition: border-color 160ms ease-out, background 160ms ease-out, box-shadow 160ms ease-out, transform 120ms ease-out;
        }
        .role-item:active { transform: scale(0.99); }
        .role-item:focus-visible { outline: 2px solid ${C.primary}; outline-offset: 3px; }
        .role-item.active {
          border-color: ${C.primary};
          background: ${C.whisper};
          box-shadow: 0 0 0 3px rgba(45,90,45,0.08);
        }
        .auth-name-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .role-check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid ${C.border};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${C.white};
          flex-shrink: 0;
          margin-top: 5px;
        }
        .role-item.active .role-check {
          border-color: ${C.primary};
          background: ${C.primary};
        }
        @media (max-width: 960px) {
          .auth-register-shell { grid-template-columns: 1fr; }
          .auth-register-intro { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 28px; }
          .auth-register-overlay { width: 56%; left: -22px; bottom: -38px; opacity: 0.34; }
          .auth-register-card { padding: 28px 20px; }
        }
        @media (max-width: 480px) {
          .auth-register-shell { border-radius: 18px; }
          .auth-register-intro {
            padding: 18px;
            min-height: 190px;
          }
          .auth-register-intro h1 {
            font-size: 27px !important;
            line-height: 1.08 !important;
            letter-spacing: -0.7px !important;
          }
          .auth-register-intro p {
            font-size: 13px !important;
            line-height: 1.55 !important;
          }
          .auth-register-overlay {
            display: none;
          }
          .auth-register-intro > div:nth-last-child(2),
          .auth-register-intro > div:last-child {
            display: none !important;
          }
          .auth-register-card {
            padding: 22px 16px 18px;
            gap: 13px;
          }
          .auth-register-card h2 { font-size: 23px !important; }
          .auth-name-grid { grid-template-columns: 1fr; }
          .auth-input {
            height: 50px;
            font-size: 16px;
          }
          .role-item {
            padding: 12px;
            min-height: 68px;
          }
        }
      `}</style>

      <div className="auth-register-shell">
        <section className="auth-register-intro" aria-hidden="true">
          <div className="auth-register-overlay" style={{ backgroundImage: `url(${registerOverlayImage.src})` }} />
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
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", opacity: 0.56, marginBottom: 14 }}>
              Account Creation
            </div>
            <h1 style={{ fontSize: 36, lineHeight: 1.06, letterSpacing: "-0.9px", margin: "0 0 14px" }}>
              Create your institutional profile.
            </h1>
            <p style={{ margin: 0, lineHeight: 1.7, color: "rgba(255,255,255,0.66)", maxWidth: 470 }}>
              Register once to apply for postgraduate programmes, enroll in professional training, and access e-learning resources from a unified portal.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
            {[
              { value: "Postgraduate", label: "Applications" },
              { value: "Training", label: "Programmes" },
              { value: "E-Learning", label: "Courses" },
            ].map((item) => (
              <div key={item.value} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 10px" }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{item.value}</div>
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.58 }}>
            <Shield size={12} />
            Secure onboarding for institutional applicants
          </div>
        </section>

        <section className="auth-register-card">
          <div>
            <h2 style={{ margin: 0, fontSize: 25, color: C.text, letterSpacing: "-0.5px" }}>Create Account</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
              Complete your details to get started.
            </p>
          </div>

          {error && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#B91C1C" }}>
              <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </div>
          )}

          {success && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.whisper, border: `1px solid ${C.pale}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: C.primary }}>
              <CheckCircle2 size={14} />
              Registration successful. Redirecting to verification...
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="auth-name-grid">
              <div>
                <label className="auth-label" htmlFor="reg-firstname">First Name</label>
                <div style={{ position: "relative" }}>
                  <User size={15} color={C.textMuted} style={{ position: "absolute", left: 14, top: 16 }} />
                  <input id="reg-firstname" className="auth-input" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required disabled={isLoading || success} placeholder="First name" />
                </div>
              </div>
              <div>
                <label className="auth-label" htmlFor="reg-lastname">Last Name</label>
                <div style={{ position: "relative" }}>
                  <User size={15} color={C.textMuted} style={{ position: "absolute", left: 14, top: 16 }} />
                  <input id="reg-lastname" className="auth-input" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" required disabled={isLoading || success} placeholder="Last name" />
                </div>
              </div>
            </div>

            <div>
              <label className="auth-label" htmlFor="reg-email">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color={C.textMuted} style={{ position: "absolute", left: 14, top: 16 }} />
                <input id="reg-email" className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" spellCheck={false} required disabled={isLoading || success} placeholder="your.email@example.com" />
              </div>
            </div>

            <div>
              <label className="auth-label" htmlFor="reg-phone">Phone Number (optional)</label>
              <div style={{ position: "relative" }}>
                <Phone size={15} color={C.textMuted} style={{ position: "absolute", left: 14, top: 16 }} />
                <input id="reg-phone" className="auth-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" disabled={isLoading || success} placeholder="0800 000 0000" />
              </div>
            </div>

            <div>
              <label className="auth-label" htmlFor="reg-password">Create Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color={C.textMuted} style={{ position: "absolute", left: 14, top: 16 }} />
                <input
                  id="reg-password"
                  className="auth-input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading || success}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass((p) => !p)} aria-label={showPass ? "Hide password" : "Show password"} style={{ position: "absolute", right: 12, top: 13, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer" }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <div className="auth-label" style={{ marginBottom: 8 }}>Registering As</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {roleConfig.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`role-item ${selectedRole === role.id ? "active" : ""}`}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: selectedRole === role.id ? "rgba(45,90,45,0.15)" : C.canvas, color: selectedRole === role.id ? C.primary : C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {role.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: selectedRole === role.id ? C.primary : C.text }}>{role.title}</div>
                      <div style={{ fontSize: 11.5, color: C.textSec, marginTop: 2, lineHeight: 1.45 }}>{role.desc}</div>
                    </div>
                    <span className="role-check" aria-hidden="true">
                      {selectedRole === role.id && <CheckCircle2 size={13} />}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.6, background: C.canvas, border: `1px solid ${C.borderSubtle}`, borderRadius: 10, padding: "10px 12px" }}>
              By creating an account, you agree to the TCoEFS Portal terms and acknowledge institutional data handling policies.
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
              aria-busy={isLoading}
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
                cursor: isLoading || success ? "not-allowed" : "pointer",
                opacity: isLoading || success ? 0.7 : 1,
              }}
            >
              {isLoading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {isLoading ? "Creating account…" : success ? "Success" : "Create Account"}
              {!isLoading && !success && <ArrowRight size={15} />}
            </button>
          </form>

          <div style={{ borderTop: `1px solid ${C.borderSubtle}`, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: C.textSec }}>
            <span>Already registered?</span>
            <Link href={loginHref} style={{ color: C.primary, fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
          </div>
        </section>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
