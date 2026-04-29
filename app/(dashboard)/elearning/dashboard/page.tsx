"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { PageLoading } from "@/components/ui";

const C = {
  darkest: "#0F2210",
  dark: "#1A3A1A",
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  whisper: "#E8F5E8",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
  warningText: "#92400E",
  warningBg: "#FEF3C7",
  infoText: "#1E40AF",
  infoBg: "#DBEAFE",
  successText: "#166534",
  successBg: "#DCFCE7",
  errorText: "#991B1B",
  errorBg: "#FEE2E2",
} as const;

type CourseCard = {
  id: string;
  slug: string;
  title: string;
  category: string;
  amountLabel: string;
  durationLabel: string;
  totalModules: number;
  progressPercent: number;
  paymentAdminNotes: string | null;
  state:
    | "free_available"
    | "payment_required"
    | "payment_pending"
    | "payment_rejected"
    | "active"
    | "completed";
  firstModuleId: string | null;
};

type DashboardSnapshot = {
  stats: {
    active: number;
    pending: number;
    completed: number;
    certificates: number;
  };
  activeCourses: CourseCard[];
  pendingCourses: CourseCard[];
  availableCourses: CourseCard[];
  completedCourses: CourseCard[];
};

function SectionCard({
  title,
  eyebrow,
  empty,
  children,
}: {
  title: string;
  eyebrow: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ borderRadius: 20, border: `1px solid ${C.borderSubtle}`, background: C.white, padding: 18, boxShadow: "0 12px 28px rgba(45,90,45,0.08)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>
        {eyebrow}
      </div>
      <h2 style={{ margin: "8px 0 0", fontSize: 22, letterSpacing: "-0.4px" }}>{title}</h2>
      <div style={{ marginTop: 14 }}>{children || <div style={{ color: C.textSec }}>{empty}</div>}</div>
    </section>
  );
}

function CourseRow({
  course,
  cta,
  onClick,
}: {
  course: CourseCard;
  cta: string;
  onClick: () => void;
}) {
  const tone =
    course.state === "payment_rejected"
      ? { fg: C.errorText, bg: C.errorBg, label: "Rejected" }
      : course.state === "payment_pending"
        ? { fg: C.infoText, bg: C.infoBg, label: "Pending Review" }
        : course.state === "payment_required"
          ? { fg: C.warningText, bg: C.warningBg, label: "Payment Needed" }
          : course.state === "completed"
            ? { fg: C.successText, bg: C.successBg, label: "Completed" }
            : { fg: C.infoText, bg: C.infoBg, label: "Active" };

  return (
    <article style={{ border: `1px solid ${C.borderSubtle}`, borderRadius: 16, padding: 14, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: C.textMuted }}>{course.category}</div>
          <div style={{ marginTop: 4, fontSize: 17, fontWeight: 800 }}>{course.title}</div>
        </div>
        <span style={{ alignSelf: "flex-start", borderRadius: 999, background: tone.bg, color: tone.fg, padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>
          {tone.label}
        </span>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: C.textSec, fontSize: 12.5 }}>
        <span>{course.amountLabel}</span>
        <span>{course.durationLabel}</span>
        <span>{course.totalModules} modules</span>
      </div>

      {course.paymentAdminNotes && course.state === "payment_rejected" ? (
        <div style={{ borderRadius: 12, background: C.errorBg, color: C.errorText, padding: "9px 10px", fontSize: 12.5 }}>
          {course.paymentAdminNotes}
        </div>
      ) : null}

      {course.progressPercent > 0 ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11.5, color: C.textMuted }}>
            <span>Progress</span>
            <span>{course.progressPercent}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: C.borderSubtle, overflow: "hidden" }}>
            <div style={{ width: `${course.progressPercent}%`, height: "100%", background: `linear-gradient(90deg, ${C.medium}, ${C.primary})` }} />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onClick}
        style={{ width: "fit-content", height: 40, border: "none", borderRadius: 12, padding: "0 14px", background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer" }}
      >
        {cta}
        <ArrowRight size={14} />
      </button>
    </article>
  );
}

export default function HomeDashboard() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/elearning/dashboard", { cache: "no-store" });
        const body = await res.json();
        if (!res.ok || !body?.success) {
          throw new Error(body?.error || "Could not load learning dashboard.");
        }
        if (active) setSnapshot(body.data as DashboardSnapshot);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load learning dashboard.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <PageLoading title="Preparing your learning dashboard…" message="Loading your courses, payment states, progress, and certificates." />;
  }

  if (error || !snapshot) {
    return <div style={{ minHeight: "100dvh", background: C.canvas, padding: 28, color: C.errorText, fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}>{error || "Could not load learning dashboard."}</div>;
  }

  return (
    <div style={{ minHeight: "100dvh", background: C.canvas, fontFamily: "var(--font-geist-sans, system-ui, sans-serif)", color: C.text }}>
      <div className="elearn-dashboard-shell" style={{ maxWidth: 1220, margin: "0 auto", padding: "28px 20px 40px", display: "grid", gap: 18 }}>
        <section className="elearn-hero" style={{ borderRadius: 24, background: `radial-gradient(circle at 80% 10%, rgba(168,212,168,0.2), transparent 30%), linear-gradient(135deg, ${C.darkest} 0%, ${C.dark} 58%, ${C.primary} 100%)`, padding: 24, color: C.white }}>
          <div className="elearn-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18, alignItems: "end" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 999, background: "rgba(255,255,255,0.12)", padding: "6px 11px", fontSize: 11, fontWeight: 700, letterSpacing: "0.55px", textTransform: "uppercase" }}>
                <ShieldCheck size={13} />
                Learning Dashboard
              </div>
              <h1 className="elearn-hero-title" style={{ margin: "16px 0 10px", fontSize: 40, lineHeight: 1.03, letterSpacing: "-1px" }}>
                Your learning, approvals, and certificates in one place.
              </h1>
              <p style={{ margin: 0, maxWidth: 720, color: "rgba(255,255,255,0.72)", lineHeight: 1.7, fontSize: 14.5 }}>
                Continue active courses, check payment approvals, and return to certificates without losing your place.
              </p>
            </div>
            <div className="elearn-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {[
                { label: "Active", value: snapshot.stats.active, icon: <BookOpen size={16} /> },
                { label: "Pending", value: snapshot.stats.pending, icon: <Clock3 size={16} /> },
                { label: "Completed", value: snapshot.stats.completed, icon: <CheckCircle2 size={16} /> },
                { label: "Certificates", value: snapshot.stats.certificates, icon: <Award size={16} /> },
              ].map((item) => (
                <div key={item.label} style={{ borderRadius: 18, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "rgba(255,255,255,0.66)" }}>{item.icon}{item.label}</div>
                  <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="elearn-content-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
          <div style={{ display: "grid", gap: 18 }}>
            <SectionCard eyebrow="Active" title="Continue Learning" empty="No active courses yet.">
              <div style={{ display: "grid", gap: 12 }}>
                {snapshot.activeCourses.map((course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    cta="Open Classroom"
                    onClick={() =>
                      course.firstModuleId &&
                      router.push(`/elearning/course/${course.id}/module/${course.firstModuleId}`)
                    }
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Pending" title="Waiting On Payment Approval" empty="You have no pending payment reviews.">
              <div style={{ display: "grid", gap: 12 }}>
                {snapshot.pendingCourses.map((course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    cta={course.state === "payment_rejected" ? "Fix Payment" : "Open Payment Status"}
                    onClick={() => router.push(`/elearning/${course.slug}`)}
                  />
                ))}
              </div>
            </SectionCard>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <SectionCard eyebrow="Discover" title="Available To Start" empty="No free-start courses are available right now.">
              <div style={{ display: "grid", gap: 12 }}>
                {snapshot.availableCourses.map((course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    cta="Review Course"
                    onClick={() => router.push(`/elearning/${course.slug}`)}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Earned" title="Completed Courses" empty="Your completed courses will appear here after verified completion.">
              <div style={{ display: "grid", gap: 12 }}>
                {snapshot.completedCourses.map((course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    cta="Open Certificates"
                    onClick={() => router.push("/elearning/certificates")}
                  />
                ))}
              </div>
            </SectionCard>

            <article style={{ borderRadius: 20, border: `1px solid ${C.borderSubtle}`, background: C.white, padding: 18, boxShadow: "0 12px 28px rgba(45,90,45,0.08)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertCircle size={18} color={C.primary} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>Course access is reviewed carefully</div>
                  <div style={{ marginTop: 6, color: C.textSec, fontSize: 13, lineHeight: 1.7 }}>
                    Paid courses appear here after approval. Free-start courses can be opened from the course catalogue when available.
                  </div>
                </div>
              </div>
              <Link href="/elearning" style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, color: C.primary, fontWeight: 700, textDecoration: "none" }}>
                Browse Course Catalogue <ArrowRight size={14} />
              </Link>
            </article>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .elearn-hero-grid,
          .elearn-content-grid {
            grid-template-columns: 1fr !important;
          }

          .elearn-hero-title {
            font-size: 32px !important;
          }
        }

        @media (max-width: 520px) {
          .elearn-dashboard-shell {
            padding: 16px 12px 28px !important;
          }
          .elearn-hero {
            padding: 20px !important;
            border-radius: 20px !important;
          }
          .elearn-hero-title {
            font-size: 28px !important;
            line-height: 1.08 !important;
            letter-spacing: -0.7px !important;
          }
          .elearn-metric-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
        }

        @media (max-width: 380px) {
          .elearn-metric-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
