"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { signUp } from "@/features/auth";
import type { UserRole } from "@/lib/contracts/status";

const C = {
  dark: "#1A3A1A",
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  white: "#FFFFFF",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  whisper: "#E8F5E8",
} as const;

type CoordinatorKind = "training" | "elearning";

const roleMap: Record<CoordinatorKind, UserRole> = {
  training: "training_coordinator",
  elearning: "e_learning_coordinator",
};

const intentMap: Record<CoordinatorKind, "training" | "elearning"> = {
  training: "training",
  elearning: "elearning",
};

export function CoordinatorRegistrationForm({ kind }: { kind: CoordinatorKind }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const title =
    kind === "training" ? "Training Coordinator Registration" : "E-Learning Coordinator Registration";
  const description =
    kind === "training"
      ? "Register to manage training resources. Access is enabled after admin verification."
      : "Register to manage e-learning content. Access is enabled after admin verification.";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signUp(
      email,
      password,
      firstName,
      lastName,
      phone || null,
      roleMap[kind],
      intentMap[kind]
    );

    if (!result.success) {
      setError(result.error || "Registration failed. Please try again.");
      setIsLoading(false);
      return;
    }

    const params = new URLSearchParams({ email });
    router.push(`/verify-email?${params.toString()}`);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: `linear-gradient(150deg, ${C.dark}, #0B160B 50%, ${C.dark})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 26, color: C.text }}>{title}</h1>
        <p style={{ margin: "8px 0 16px", color: C.textSec, fontSize: 14, lineHeight: 1.6 }}>{description}</p>

        {error ? (
          <div style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FCA5A5", borderRadius: 10, padding: "10px 12px", fontSize: 12, marginBottom: 12 }}>
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required style={inputStyle} />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required style={inputStyle} />
          </div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required style={inputStyle} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (optional)" style={inputStyle} />
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{ ...inputStyle, paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{ position: "absolute", right: 10, top: 12, border: "none", background: "transparent", color: C.textMuted }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              border: "none",
              borderRadius: 10,
              height: 48,
              fontWeight: 700,
              color: C.white,
              background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? <><Loader2 size={16} /> Registering...</> : <>Register and continue <ArrowRight size={15} /></>}
          </button>
        </form>

        <div style={{ marginTop: 14, background: C.whisper, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: C.textSec }}>
          After email verification, your account stays pending until an admin approves it. You will receive an email when access is enabled.
        </div>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <Link href="/login" style={{ color: C.primary, textDecoration: "none", fontWeight: 700 }}>Back to login</Link>
          <Link href="/register" style={{ color: C.primary, textDecoration: "none", fontWeight: 700 }}>Participant registration</Link>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 10,
  border: `1.5px solid ${C.border}`,
  padding: "0 12px",
  fontSize: 14,
  color: C.text,
  outline: "none",
};
