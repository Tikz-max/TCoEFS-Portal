"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  PlayCircle,
} from "lucide-react";

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
  infoText: "#1E40AF",
  infoBg: "#DBEAFE",
  successText: "#166534",
  successBg: "#DCFCE7",
  errorText: "#991B1B",
  errorBg: "#FEE2E2",
} as const;

type Workspace = {
  course: {
    id: string;
    slug: string;
    title: string;
    progressPercent: number;
    amountLabel: string;
    passedQuizzes: number;
    totalQuizzes: number;
    certificateId: string | null;
  };
  selectedModule: {
    id: string;
    title: string;
    type: string;
    contentUrl: string | null;
    completed: boolean;
    quizzes: Array<{
      id: string;
      title: string;
      passingScore: number;
      questionCount: number;
      passed: boolean;
    }>;
  };
  modules: Array<{
    id: string;
    title: string;
    type: string;
    completed: boolean;
    current: boolean;
    recommended: boolean;
    quizCount: number;
  }>;
};

function typeIcon(type: string) {
  if (type === "video") return <PlayCircle size={15} color={C.primary} />;
  if (type === "document") return <FileText size={15} color={C.primary} />;
  return <BookOpen size={15} color={C.primary} />;
}

export default function ModulePlayerPage() {
  const params = useParams<{ courseId: string; moduleId: string }>();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadWorkspace() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/elearning/workspace/${params.courseId}?moduleId=${params.moduleId}`,
        { cache: "no-store" }
      );
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not load learning workspace.");
      }
      setWorkspace(body.data as Workspace);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load learning workspace."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, [params.courseId, params.moduleId]);

  const markComplete = async () => {
    if (!workspace) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/elearning/courses/${params.courseId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: workspace.selectedModule.id, completed: true }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not update progress.");
      }
      await loadWorkspace();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update progress.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: "100dvh", background: C.canvas, padding: 28, color: C.textSec, fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}>Loading learning workspace...</div>;
  }

  if (error || !workspace) {
    return (
      <div style={{ minHeight: "100dvh", background: C.canvas, padding: 28, fontFamily: "var(--font-geist-sans, system-ui, sans-serif)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", borderRadius: 18, background: C.white, border: `1px solid ${C.borderSubtle}`, padding: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Learning workspace unavailable</div>
          <div style={{ marginTop: 8, color: C.textSec, lineHeight: 1.7 }}>{error || "Could not load this module."}</div>
          <Link href={`/elearning`} style={{ marginTop: 14, display: "inline-flex", gap: 7, alignItems: "center", textDecoration: "none", color: C.primary, fontWeight: 700 }}>
            Back to Course Catalogue <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: C.canvas, fontFamily: "var(--font-geist-sans, system-ui, sans-serif)", color: C.text }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 20px 34px", display: "grid", gridTemplateColumns: "280px 1fr 320px", gap: 18 }}>
        <aside style={{ borderRadius: 20, background: C.white, border: `1px solid ${C.borderSubtle}`, padding: 16, boxShadow: "0 12px 28px rgba(45,90,45,0.08)", alignSelf: "start" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", color: C.textMuted, textTransform: "uppercase" }}>Course Modules</div>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {workspace.modules.map((module, index) => (
              <button
                key={module.id}
                type="button"
                onClick={() => router.push(`/elearning/course/${params.courseId}/module/${module.id}`)}
                style={{
                  borderRadius: 14,
                  border: module.current ? `1px solid ${C.primary}` : `1px solid ${C.borderSubtle}`,
                  background: module.current ? C.whisper : C.white,
                  padding: "11px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700 }}>
                    {module.completed ? <CheckCircle2 size={14} color={C.successText} /> : typeIcon(module.type)}
                    Module {index + 1}
                  </div>
                  {module.recommended && !module.completed ? (
                    <span style={{ fontSize: 10.5, color: C.infoText, background: C.infoBg, borderRadius: 999, padding: "3px 7px", fontWeight: 700 }}>
                      Current
                    </span>
                  ) : null}
                </div>
                <div style={{ marginTop: 5, fontSize: 12.5, color: C.textSec, lineHeight: 1.5 }}>{module.title}</div>
              </button>
            ))}
          </div>
        </aside>

        <main style={{ display: "grid", gap: 16 }}>
          <section style={{ borderRadius: 22, background: `radial-gradient(circle at 80% 12%, rgba(168,212,168,0.18), transparent 28%), linear-gradient(140deg, ${C.dark} 0%, ${C.darkest} 58%, #1f3e1f 100%)`, color: C.white, padding: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: "rgba(255,255,255,0.64)" }}>
              Learning Workspace
            </div>
            <h1 style={{ margin: "10px 0 6px", fontSize: 32, lineHeight: 1.05, letterSpacing: "-0.8px" }}>{workspace.selectedModule.title}</h1>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "rgba(255,255,255,0.72)", fontSize: 13.5 }}>
              <span>{workspace.course.title}</span>
              <span style={{ textTransform: "capitalize" }}>{workspace.selectedModule.type}</span>
              <span>{workspace.course.progressPercent}% overall progress</span>
            </div>
          </section>

          <section style={{ borderRadius: 20, background: C.white, border: `1px solid ${C.borderSubtle}`, padding: 18, boxShadow: "0 12px 28px rgba(45,90,45,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", color: C.textMuted, textTransform: "uppercase" }}>Module Content</div>
                <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800 }}>{workspace.selectedModule.title}</div>
              </div>
              {workspace.selectedModule.contentUrl ? (
                <a
                  href={workspace.selectedModule.contentUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ height: 40, display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 12, border: `1px solid ${C.border}`, textDecoration: "none", color: C.textSec, padding: "0 14px", fontSize: 12.5, fontWeight: 700 }}
                >
                  Open Resource
                  <ExternalLink size={14} />
                </a>
              ) : null}
            </div>

            <div style={{ marginTop: 14, borderRadius: 16, background: C.canvas, border: `1px solid ${C.borderSubtle}`, padding: 14 }}>
              {workspace.selectedModule.contentUrl ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ color: C.textSec, fontSize: 13.5, lineHeight: 1.7 }}>
                    This module uses an external learning resource. Open it in a dedicated tab, complete the activity, then mark the module as complete here to progress through the course.
                  </div>
                  <a
                    href={workspace.selectedModule.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ width: "fit-content", height: 42, display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 12, textDecoration: "none", border: "none", background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, padding: "0 15px", fontSize: 12.5, fontWeight: 700 }}
                  >
                    Launch Module Resource
                    <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <div style={{ color: C.textSec, fontSize: 13.5, lineHeight: 1.7 }}>
                  No resource URL has been attached to this module yet. The classroom shell is ready, but content needs to be published by the course team before learners can consume it.
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={markComplete}
                disabled={workspace.selectedModule.completed || busy}
                style={{ height: 42, border: "none", borderRadius: 12, background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, padding: "0 15px", fontSize: 12.5, fontWeight: 700, cursor: workspace.selectedModule.completed || busy ? "not-allowed" : "pointer", opacity: workspace.selectedModule.completed || busy ? 0.7 : 1 }}
              >
                {workspace.selectedModule.completed ? "Module Completed" : busy ? "Saving..." : "Mark Module Complete"}
              </button>
              <Link href="/elearning/dashboard" style={{ height: 42, display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 12, textDecoration: "none", border: `1px solid ${C.border}`, color: C.textSec, padding: "0 14px", fontSize: 12.5, fontWeight: 700, background: C.white }}>
                Return to Dashboard
              </Link>
            </div>

            {error ? (
              <div style={{ marginTop: 12, borderRadius: 12, background: C.errorBg, color: C.errorText, padding: "10px 12px", fontSize: 12.5 }}>{error}</div>
            ) : null}
          </section>
        </main>

        <aside style={{ display: "grid", gap: 16, alignSelf: "start" }}>
          <article style={{ borderRadius: 20, background: C.white, border: `1px solid ${C.borderSubtle}`, padding: 18, boxShadow: "0 12px 28px rgba(45,90,45,0.08)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", color: C.textMuted, textTransform: "uppercase" }}>Course Progress</div>
            <div style={{ marginTop: 10, fontSize: 34, fontWeight: 800 }}>{workspace.course.progressPercent}%</div>
            <div style={{ marginTop: 8, height: 10, borderRadius: 999, background: C.borderSubtle, overflow: "hidden" }}>
              <div style={{ width: `${workspace.course.progressPercent}%`, height: "100%", background: `linear-gradient(90deg, ${C.medium}, ${C.primary})` }} />
            </div>
            <div style={{ marginTop: 10, color: C.textSec, fontSize: 12.5, lineHeight: 1.65 }}>
              Paid access is already verified for this course. Progress now depends on module completion and quiz performance.
            </div>
          </article>

          <article style={{ borderRadius: 20, background: C.white, border: `1px solid ${C.borderSubtle}`, padding: 18, boxShadow: "0 12px 28px rgba(45,90,45,0.08)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", color: C.textMuted, textTransform: "uppercase" }}>Assessment</div>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {workspace.selectedModule.quizzes.length === 0 ? (
                <div style={{ color: C.textSec, fontSize: 13 }}>No quiz is attached to this module.</div>
              ) : (
                workspace.selectedModule.quizzes.map((quiz) => (
                  <div key={quiz.id} style={{ borderRadius: 14, border: `1px solid ${C.borderSubtle}`, padding: 12 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800 }}>{quiz.title}</div>
                    <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 10, color: C.textSec, fontSize: 12.5 }}>
                      <span>{quiz.questionCount} questions</span>
                      <span>Pass mark {quiz.passingScore}%</span>
                    </div>
                    <div style={{ marginTop: 8, color: quiz.passed ? C.successText : C.infoText, fontSize: 12.5, fontWeight: 700 }}>
                      {quiz.passed ? "Passed" : "Pending attempt"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article style={{ borderRadius: 20, background: C.white, border: `1px solid ${C.borderSubtle}`, padding: 18, boxShadow: "0 12px 28px rgba(45,90,45,0.08)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", color: C.textMuted, textTransform: "uppercase" }}>Certificate Status</div>
            <div style={{ marginTop: 10, fontSize: 15, fontWeight: 800 }}>{workspace.course.certificateId ? "Issued" : "Locked"}</div>
            <div style={{ marginTop: 8, color: C.textSec, fontSize: 12.5, lineHeight: 1.65 }}>
              {workspace.course.certificateId
                ? "Your certificate has been generated. Open the certificate page to review and download it."
                : `Quizzes passed: ${workspace.course.passedQuizzes} of ${workspace.course.totalQuizzes}. Certificates appear only after verified completion.`}
            </div>
            <Link href="/elearning/certificates" style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7, color: C.primary, fontWeight: 700, textDecoration: "none" }}>
              Open Certificates <ArrowRight size={14} />
            </Link>
          </article>
        </aside>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          div[style*="grid-template-columns: 280px 1fr 320px"] {
            grid-template-columns: 1fr !important;
          }

          h1 {
            font-size: 28px !important;
          }
        }
      `}</style>
    </div>
  );
}
