"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Layers,
  LockKeyhole,
  Monitor,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar/Navbar";

const C = {
  darkest: "#0F2210",
  dark: "#1A3A1A",
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  light: "#56985E",
  pale: "#A8D4A8",
  whisper: "#E8F5E8",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  gold: "#C49A26",
  goldWhisper: "#FDF3D0",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  textOnGreen: "#FFFFFF",
  border: "#D8E4D8",
  borderStrong: "#B0C8B0",
  borderSubtle: "#EBF0EB",
  warningText: "#92400E",
  warningBg: "#FEF3C7",
  infoBg: "#DBEAFE",
  infoText: "#1E40AF",
  successBg: "#DCFCE7",
  successText: "#166534",
  errorBg: "#FEE2E2",
  errorText: "#991B1B",
} as const;

const shadow = {
  elev1:
    "inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev2:
    "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12), 0 8px 16px rgba(45,90,45,0.08)",
} as const;

type CourseDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  durationLabel: string;
  pricingType: "free" | "paid";
  amount: number;
  amountLabel: string;
  certificateEnabled: boolean;
  totalModules: number;
  totalQuizzes: number;
  passedQuizzes: number;
  progressPercent: number;
  state:
    | "free_available"
    | "payment_required"
    | "payment_pending"
    | "payment_rejected"
    | "active"
    | "completed";
  ctaLabel: string;
  firstModuleId: string | null;
  paymentId: string | null;
  paymentStatus: "none" | "pending_receipt" | "pending_approval" | "successful" | "failed";
  paymentAdminNotes: string | null;
  modules: Array<{ id: string; title: string; type: string; order: number }>;
};

function stateMessage(course: CourseDetail) {
  switch (course.state) {
    case "completed":
      return {
        title: "Certificate unlocked",
        tone: { fg: C.successText, bg: C.successBg },
        body: "You have finished the full course path. Open your certificate vault to review the issued completion record.",
      };
    case "active":
      return {
        title: "Classroom access active",
        tone: { fg: C.infoText, bg: C.infoBg },
        body: "This course is already open on your account. Continue the modules, finish the assessments, and complete the track for certificate issuance.",
      };
    case "payment_pending":
      return {
        title: "Receipt under review",
        tone: { fg: C.infoText, bg: C.infoBg },
        body: "Your proof of payment has been submitted. The course stays locked until the admin team verifies the transfer.",
      };
    case "payment_rejected":
      return {
        title: "Payment requires correction",
        tone: { fg: C.errorText, bg: C.errorBg },
        body:
          course.paymentAdminNotes ||
          "Your uploaded receipt was not approved. Review the issue, make the correction, and submit a new receipt.",
      };
    case "payment_required":
      return {
        title: "Approval-gated access",
        tone: { fg: C.warningText, bg: C.warningBg },
        body: "This is a paid course. Enrollment starts here, but the classroom opens only after receipt upload and admin approval.",
      };
    default:
      return {
        title: "Immediate free access",
        tone: { fg: C.successText, bg: C.successBg },
        body: "This course is free. Once you enroll, you can begin learning immediately from the first module.",
      };
  }
}

function isAllowedUploadType(contentType: string) {
  return (
    contentType === "application/pdf" ||
    contentType === "image/jpeg" ||
    contentType === "image/png"
  );
}

export default function ELearningCoursePage() {
  const router = useRouter();
  const params = useParams<{ course: string }>();
  const slug = params.course;
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bankName: "Access Bank PLC",
    accountNumber: "1886573891",
    accountName: "University of Jos External Funded Account",
    instructions:
      "Transfer the exact course amount, then upload your receipt for admin approval.",
  });

  const loginHref = `/login?redirect=${encodeURIComponent(`/elearning/${slug}`)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(`/elearning/${slug}`)}`;

  async function loadCourse() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/elearning/catalog/${slug}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not load course detail.");
      }
      setCourse(body.data as CourseDetail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load course detail.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCourse();
  }, [slug]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/payments/bank-details", { method: "GET" });
        const body = await res.json();
        if (!res.ok || !body?.success || !body?.data) return;
        setBankDetails((prev) => ({
          bankName: body.data.bankName || prev.bankName,
          accountNumber: body.data.accountNumber || prev.accountNumber,
          accountName: body.data.accountName || prev.accountName,
          instructions: body.data.instructions || prev.instructions,
        }));
      } catch {
        // Keep defaults.
      }
    })();
  }, []);

  const stateCard = useMemo(() => (course ? stateMessage(course) : null), [course]);

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(bankDetails.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const startEnrollment = async () => {
    if (!course) return;
    setIsEnrolling(true);
    setActionError("");
    try {
      const res = await fetch(`/api/elearning/courses/${course.id}/enroll`, { method: "POST" });
      const body = await res.json();
      if (res.status === 401) {
        router.push(loginHref);
        return;
      }
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not start enrollment.");
      }
      await loadCourse();
    } catch (enrollError) {
      setActionError(enrollError instanceof Error ? enrollError.message : "Could not start enrollment.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const uploadReceipt = async () => {
    if (!course?.paymentId) {
      setActionError("Start enrollment first so a payment record can be created.");
      return;
    }
    if (!receipt) {
      setActionError("Select a receipt file before submitting.");
      return;
    }
    if (!isAllowedUploadType(receipt.type)) {
      setActionError("Accepted receipt formats are PDF, JPG, and PNG.");
      return;
    }
    if (receipt.size > 10 * 1024 * 1024) {
      setActionError("Receipt file size must not exceed 10MB.");
      return;
    }

    setUploading(true);
    setActionError("");
    try {
      const formData = new FormData();
      formData.set("paymentId", course.paymentId);
      formData.set("file", receipt);

      const res = await fetch("/api/payments/receipt", {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not upload receipt.");
      }
      await loadCourse();
      setReceipt(null);
    } catch (uploadError) {
      setActionError(uploadError instanceof Error ? uploadError.message : "Could not upload receipt.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: C.canvas, fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}>
        <Navbar activePage="elearning" />
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "36px 20px", color: C.textSec }}>
          Loading course details...
        </div>
      </div>
    );
  }

  if (error || !course || !stateCard) {
    return (
      <div style={{ minHeight: "100dvh", background: C.canvas, fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}>
        <Navbar activePage="elearning" />
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 20px" }}>
          <div style={{ borderRadius: 18, background: C.white, border: `1px solid ${C.borderSubtle}`, padding: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Course unavailable</div>
            <div style={{ marginTop: 8, color: C.textSec, lineHeight: 1.7 }}>{error || "This course could not be loaded."}</div>
            <Link href="/elearning" style={{ marginTop: 14, display: "inline-flex", color: C.primary, fontWeight: 700, textDecoration: "none" }}>
              Return to catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: C.canvas,
        fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
      }}
    >
      <style>{`
        @media (max-width: 960px) {
          .el-d-layout {
            grid-template-columns: 1fr !important;
          }
          .el-d-hero {
            grid-template-columns: 1fr !important;
          }
          .el-d-main {
            grid-template-columns: 1fr !important;
          }
          .el-d-side {
            padding: 32px 22px !important;
          }
          .el-d-side h1 {
            font-size: 42px !important;
            line-height: 0.98 !important;
          }
          .el-d-stats {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

      <Navbar activePage="elearning" />

      <div className="el-d-layout" style={{ flex: 1, display: "grid", gridTemplateColumns: "320px 1fr" }}>
        <aside
          className="el-d-side"
          style={{
            background: `linear-gradient(180deg, ${C.darkest} 0%, ${C.dark} 100%)`,
            color: C.white,
            padding: "40px 34px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -88,
              bottom: -90,
              width: 260,
              height: 260,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.07)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <Link href="/elearning" style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", color: "rgba(255,255,255,0.72)", fontSize: 12.5, fontWeight: 700, marginBottom: 22 }}>
              <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
              Back to catalogue
            </Link>

            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.95px", opacity: 0.56, marginBottom: 12 }}>
              {course.category}
            </div>
            <h1 style={{ margin: 0, fontSize: 52, lineHeight: 0.93, letterSpacing: "-1.4px" }}>{course.title}</h1>
            <p style={{ margin: "16px 0 0", color: "rgba(255,255,255,0.66)", fontSize: 14, lineHeight: 1.72 }}>
              {course.description}
            </p>

            <div className="el-d-stats" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 24 }}>
              {[
                { label: "Access", value: course.amountLabel },
                { label: "Level", value: course.level },
                { label: "Modules", value: String(course.totalModules) },
                { label: "Duration", value: course.durationLabel },
              ].map((item) => (
                <div key={item.label} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 11px" }}>
                  <div style={{ fontSize: 10, opacity: 0.55 }}>{item.label}</div>
                  <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, borderRadius: 18, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.55px", textTransform: "uppercase", opacity: 0.62, marginBottom: 8 }}>
                Access Rule
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700 }}>
                {course.state === "active" || course.state === "completed" ? <ShieldCheck size={16} /> : <LockKeyhole size={16} />}
                {stateCard.title}
              </div>
              <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.65, color: "rgba(255,255,255,0.7)" }}>
                {stateCard.body}
              </div>
            </div>
          </div>
        </aside>

        <div style={{ padding: "28px 28px 40px" }}>
          <section
            className="el-d-hero"
            style={{
              display: "grid",
              gridTemplateColumns: "1.15fr 0.85fr",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <article
              style={{
                borderRadius: 24,
                background: C.white,
                border: `1px solid ${C.borderSubtle}`,
                boxShadow: shadow.elev2,
                padding: 20,
              }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <span style={{ fontSize: 11.5, color: C.textSec, background: C.whisper, borderRadius: 999, padding: "4px 8px" }}>
                  {course.level}
                </span>
                <span style={{ fontSize: 11.5, color: C.gold, background: C.goldWhisper, borderRadius: 999, padding: "4px 8px" }}>
                  {course.amountLabel}
                </span>
                <span style={{ fontSize: 11.5, color: stateCard.tone.fg, background: stateCard.tone.bg, borderRadius: 999, padding: "4px 8px" }}>
                  {stateCard.title}
                </span>
              </div>

              <h2 style={{ margin: 0, fontSize: 26, letterSpacing: "-0.5px", color: C.text }}>
                What this course delivers
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginTop: 16 }}>
                {[
                  {
                    label: "Modules",
                    value: String(course.totalModules),
                    icon: <Layers size={14} color={C.primary} />,
                  },
                  {
                    label: "Duration",
                    value: course.durationLabel,
                    icon: <Clock size={14} color={C.primary} />,
                  },
                  {
                    label: "Assessment",
                    value: `${course.totalQuizzes} quiz${course.totalQuizzes === 1 ? "" : "zes"}`,
                    icon: <ClipboardList size={14} color={C.primary} />,
                  },
                  {
                    label: "Certificate",
                    value: course.certificateEnabled ? "Issued on completion" : "Not included",
                    icon: <Award size={14} color={C.gold} />,
                  },
                ].map((item) => (
                  <div key={item.label} style={{ borderRadius: 14, border: `1px solid ${C.borderSubtle}`, background: "#FBFDFB", padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textMuted }}>{item.icon}{item.label}</div>
                    <div style={{ marginTop: 7, fontSize: 13.5, fontWeight: 700, color: C.text }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, color: C.textSec, fontSize: 13.5, lineHeight: 1.72 }}>
                TCoEFS e-learning tracks are designed to separate course discovery, payment verification, classroom access, and certificate issuance. The visual experience is premium, but the enrollment rules are explicit and production-safe.
              </div>
            </article>

            <article
              style={{
                borderRadius: 24,
                background: C.white,
                border: `1px solid ${C.borderSubtle}`,
                boxShadow: shadow.elev2,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted, marginBottom: 8 }}>
                Enrollment Rail
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.45px" }}>{course.amountLabel}</div>
              <div style={{ marginTop: 6, color: C.textSec, fontSize: 13, lineHeight: 1.68 }}>{stateCard.body}</div>

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                {course.state === "active" && course.firstModuleId ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/elearning/course/${course.id}/module/${course.firstModuleId}`)}
                    style={{ height: 44, border: "none", borderRadius: 12, background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
                  >
                    Continue Learning
                  </button>
                ) : null}

                {course.state === "completed" ? (
                  <button
                    type="button"
                    onClick={() => router.push("/elearning/certificates")}
                    style={{ height: 44, border: "none", borderRadius: 12, background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
                  >
                    Open Certificates
                  </button>
                ) : null}

                {(course.state === "free_available" || course.state === "payment_required") ? (
                  <button
                    type="button"
                    onClick={startEnrollment}
                    disabled={isEnrolling}
                    style={{ height: 44, border: "none", borderRadius: 12, background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 13.5, fontWeight: 700, cursor: isEnrolling ? "not-allowed" : "pointer", opacity: isEnrolling ? 0.7 : 1 }}
                  >
                    {isEnrolling ? "Starting..." : course.ctaLabel}
                  </button>
                ) : null}

                {course.state !== "active" && course.state !== "completed" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Link href={loginHref} style={{ height: 42, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 12, border: `1px solid ${C.border}`, textDecoration: "none", color: C.textSec, fontWeight: 700, fontSize: 12.5, background: C.white }}>
                      Sign In
                    </Link>
                    <Link href={registerHref} style={{ height: 42, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 12, border: `1px solid ${C.primary}`, textDecoration: "none", color: C.primary, fontWeight: 700, fontSize: 12.5, background: C.whisper }}>
                      Create Account
                    </Link>
                  </div>
                ) : null}
              </div>

              {actionError ? (
                <div style={{ marginTop: 12, borderRadius: 12, background: C.errorBg, color: C.errorText, padding: "10px 12px", fontSize: 12.5 }}>
                  {actionError}
                </div>
              ) : null}
            </article>
          </section>

          <div className="el-d-main" style={{ display: "grid", gridTemplateColumns: "1.04fr 0.96fr", gap: 18 }}>
            <div style={{ display: "grid", gap: 18 }}>
              <article style={{ borderRadius: 22, background: C.white, border: `1px solid ${C.borderSubtle}`, boxShadow: shadow.elev2, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted, marginBottom: 10 }}>
                  Curriculum Preview
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {course.modules.map((module) => (
                    <div key={module.id} style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 14, alignItems: "start", borderBottom: `1px solid ${C.borderSubtle}`, paddingBottom: 12, marginBottom: 2 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 14, background: C.whisper, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: shadow.elev1 }}>
                        <BookOpen size={16} color={C.primary} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: C.textMuted }}>Module {module.order + 1}</div>
                        <div style={{ marginTop: 3, fontSize: 15, fontWeight: 700, color: C.text }}>{module.title}</div>
                      </div>
                      <span style={{ fontSize: 11.5, color: C.textSec, background: C.whisper, borderRadius: 999, padding: "4px 8px", textTransform: "capitalize" }}>
                        {module.type}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article style={{ borderRadius: 22, background: C.white, border: `1px solid ${C.borderSubtle}`, boxShadow: shadow.elev2, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted, marginBottom: 10 }}>
                  Course Structure
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    "Select the course intentionally from the public catalogue instead of landing inside modules immediately.",
                    course.pricingType === "free"
                      ? "Because this track is free, the first module opens as soon as enrollment is confirmed."
                      : "Because this track is paid, the first module remains locked until receipt upload and admin approval are complete.",
                    "All modules and assessments contribute to the real completion record used for certificate issuance.",
                    "Certificates are issued after verified completion, not on account creation.",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13.5, color: C.textSec, lineHeight: 1.68 }}>
                      <Check size={14} color={C.primary} style={{ marginTop: 3, flexShrink: 0 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              {course.pricingType === "paid" && course.paymentId && course.state !== "active" && course.state !== "completed" ? (
                <article style={{ borderRadius: 22, background: C.white, border: `1px solid ${C.borderSubtle}`, boxShadow: shadow.elev2, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted, marginBottom: 10 }}>
                    Payment Verification
                  </div>

                  <div style={{ borderRadius: 18, border: `1px solid ${C.borderSubtle}`, background: "linear-gradient(180deg, #F5FAF5 0%, var(--green-whisper) 100%)", padding: 14, display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: C.text }}>
                      <Building2 size={16} color={C.primary} />
                      Bank transfer details
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 7, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: C.textMuted }}>Bank</span>
                      <strong style={{ fontSize: 13.5, color: C.text }}>{bankDetails.bankName}</strong>
                      <span style={{ fontSize: 12, color: C.textMuted }}>Account Number</span>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <strong style={{ fontSize: 21, letterSpacing: "0.25px", color: C.text, fontFamily: "var(--font-geist-mono, monospace)" }}>{bankDetails.accountNumber}</strong>
                        <button type="button" onClick={copyAccountNumber} style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: 8, width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                      <span style={{ fontSize: 12, color: C.textMuted }}>Account Name</span>
                      <strong style={{ fontSize: 13.5, color: C.text }}>{bankDetails.accountName}</strong>
                      <span style={{ fontSize: 12, color: C.textMuted }}>Course Fee</span>
                      <strong style={{ fontSize: 20, color: C.primary }}>{course.amountLabel}</strong>
                    </div>
                  </div>

                  <p style={{ margin: "12px 0 0", color: C.textSec, fontSize: 13, lineHeight: 1.7 }}>{bankDetails.instructions}</p>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    <div style={{ fontSize: 12.5, color: C.textSec }}>Upload payment receipt (PDF, JPG, PNG, max 10MB)</div>
                    <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setReceipt(event.target.files?.[0] || null)} />
                    <button type="button" onClick={uploadReceipt} disabled={uploading} style={{ height: 42, border: "none", borderRadius: 12, background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 13, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
                      {uploading ? "Uploading..." : "Upload Receipt for Approval"}
                    </button>
                  </div>
                </article>
              ) : null}

              <article style={{ borderRadius: 22, background: C.white, border: `1px solid ${C.borderSubtle}`, boxShadow: shadow.elev2, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted, marginBottom: 10 }}>
                  Completion & Certification
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ borderRadius: 14, background: C.canvas, padding: 12 }}>
                    <div style={{ fontSize: 12, color: C.textMuted }}>Quiz status</div>
                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: C.text }}>{course.passedQuizzes} of {course.totalQuizzes} quizzes passed</div>
                  </div>
                  <div style={{ borderRadius: 14, background: C.canvas, padding: 12 }}>
                    <div style={{ fontSize: 12, color: C.textMuted }}>Certificate rule</div>
                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: C.text }}>Issued only after verified completion</div>
                  </div>
                  <div style={{ borderRadius: 14, background: C.canvas, padding: 12 }}>
                    <div style={{ fontSize: 12, color: C.textMuted }}>Access environment</div>
                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: C.text }}>Protected learner workspace</div>
                  </div>
                </div>
              </article>

              <article style={{ borderRadius: 22, background: C.white, border: `1px solid ${C.borderSubtle}`, boxShadow: shadow.elev2, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  {course.state === "active" || course.state === "completed" ? <ShieldCheck size={16} color={C.infoText} /> : <AlertCircle size={16} color={stateCard.tone.fg} />}
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>
                    Current State
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{stateCard.title}</div>
                <div style={{ marginTop: 8, color: C.textSec, fontSize: 13.5, lineHeight: 1.68 }}>{stateCard.body}</div>
                <Link href="/elearning/dashboard" style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", color: C.primary, fontWeight: 700, fontSize: 12.5 }}>
                  Open learner dashboard <ArrowRight size={14} />
                </Link>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
