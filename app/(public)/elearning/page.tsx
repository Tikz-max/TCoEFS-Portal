"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  ChevronRight,
  Clock3,
  GraduationCap,
  Search,
  ShieldCheck,
  SlidersHorizontal,
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

type CourseCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  durationLabel: string;
  pricingType: "free" | "paid";
  amountLabel: string;
  totalModules: number;
  progressPercent: number;
  certificateEnabled: boolean;
  state:
    | "free_available"
    | "payment_required"
    | "payment_pending"
    | "payment_rejected"
    | "active"
    | "completed";
  ctaLabel: string;
  firstModuleId: string | null;
  accent: string;
};

function stateTone(state: CourseCard["state"]) {
  switch (state) {
    case "completed":
      return { label: "Completed", fg: C.successText, bg: C.successBg };
    case "active":
      return { label: "Continue Learning", fg: C.infoText, bg: C.infoBg };
    case "payment_pending":
      return { label: "Awaiting Approval", fg: C.infoText, bg: C.infoBg };
    case "payment_rejected":
      return { label: "Payment Rejected", fg: C.errorText, bg: C.errorBg };
    case "payment_required":
      return { label: "Payment Required", fg: C.warningText, bg: C.warningBg };
    default:
      return { label: "Open for Enrollment", fg: C.successText, bg: C.successBg };
  }
}

export default function ELearningPage() {
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/elearning/catalog", { cache: "no-store" });
        const body = await res.json();
        if (!res.ok || !body?.success) {
          throw new Error(body?.error || "Could not load course catalog.");
        }

        if (active) {
          setCourses((body.data || []) as CourseCard[]);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load course catalog."
          );
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

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      if (filter === "free" && course.pricingType !== "free") return false;
      if (filter === "paid" && course.pricingType !== "paid") return false;

      if (!search.trim()) return true;
      const needle = search.toLowerCase();
      return (
        course.title.toLowerCase().includes(needle) ||
        course.category.toLowerCase().includes(needle) ||
        course.level.toLowerCase().includes(needle)
      );
    });
  }, [courses, filter, search]);

  const stats = [
    { value: courses.length, label: "Courses Available" },
    {
      value: courses.filter((course) => course.pricingType === "free").length,
      label: "Free Courses",
    },
    {
      value: courses.filter((course) => course.certificateEnabled).length,
      label: "Certificate Tracks",
    },
    { value: "70%", label: "Pass Threshold" },
  ];

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
        .el-c-row { transition: background 0.18s ease, transform 0.18s ease; cursor: pointer; }
        .el-c-row:hover { background: ${C.white} !important; transform: translateY(-1px); }
        .el-c-cta { transition: all 0.18s ease; }
        .el-c-cta:hover { background: ${C.dark} !important; color: white !important; border-color: transparent !important; }
        .el-c-photo {
          min-height: 160px;
          border-radius: 24px;
          background:
            radial-gradient(circle at 22% 18%, rgba(168,212,168,0.24), transparent 26%),
            linear-gradient(160deg, rgba(255,255,255,0.1), rgba(255,255,255,0)),
            linear-gradient(150deg, #183518 0%, #122812 100%);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 22px 56px rgba(0,0,0,0.24);
          position: relative;
          overflow: hidden;
          margin-top: 4px;
        }
        .el-c-photo::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15,34,16,0.04), rgba(15,34,16,0.52));
        }
        @media (max-width: 920px) {
          .el-c-layout {
            grid-template-columns: 1fr !important;
          }
          .el-c-side {
            padding: 38px 24px !important;
            gap: 28px !important;
          }
          .el-c-side h1 {
            font-size: 46px !important;
            line-height: 0.96 !important;
          }
          .el-c-photo {
            min-height: 220px;
          }
          .el-c-header {
            align-items: stretch !important;
            flex-direction: column !important;
            gap: 16px !important;
            padding: 24px 20px !important;
          }
          .el-c-controls {
            flex-wrap: wrap !important;
          }
          .el-c-controls input {
            width: min(100%, 260px) !important;
          }
          .el-c-row {
            grid-template-columns: 42px 1fr !important;
            padding: 24px 20px !important;
          }
          .el-c-row > :last-child {
            grid-column: 1 / -1 !important;
            justify-content: flex-start !important;
          }
        }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>

      <Navbar activePage="elearning" />

      <div
        className="el-c-layout"
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          overflow: "visible",
        }}
      >
        <div
          className="el-c-side"
          style={{
            background: `linear-gradient(180deg, ${C.darkest} 0%, ${C.dark} 100%)`,
            padding: "44px 38px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "visible",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -60,
              bottom: -60,
              width: 260,
              height: 260,
              borderRadius: "50%",
              border: "1px solid rgba(86,152,94,0.07)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <GraduationCap size={15} color="rgba(255,255,255,0.9)" />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                }}
              >
                TCoEFS Learning
              </span>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  opacity: 0.56,
                  marginBottom: 14,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                Course Catalogue
              </div>
              <h1
                style={{
                  margin: "0 0 16px",
                  color: C.white,
                  fontSize: 58,
                  lineHeight: 0.92,
                  letterSpacing: "-1.8px",
                }}
              >
                Learn before
                <br />
                you enter.
              </h1>
              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.66)",
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                Browse real TCoEFS courses, review the curriculum, and see whether each
                track is free or requires verified payment before access.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gap: 10,
                marginBottom: 22,
              }}
            >
              {stats.map((item) => (
                <div
                  key={item.label}
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "10px 10px",
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.white }}>{item.value}</div>
                  <div style={{ fontSize: 10, opacity: 0.58, marginTop: 2, color: "rgba(255,255,255,0.75)" }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div className="el-c-photo">
              <div style={{ position: "absolute", inset: 0, zIndex: 1, padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "inline-flex", width: "fit-content", alignItems: "center", gap: 6, borderRadius: 999, background: "rgba(255,255,255,0.12)", color: C.white, padding: "6px 10px", fontSize: 11, fontWeight: 700 }}>
                  <ShieldCheck size={12} /> Verified Access Flow
                </div>
                <div style={{ color: C.white }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Free courses unlock instantly</div>
                  <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.55, color: "rgba(255,255,255,0.72)" }}>
                    Paid tracks stay locked until receipt upload and admin approval.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.6, color: "rgba(255,255,255,0.82)" }}>
            <Award size={12} /> Certificates appear after verified completion only.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            className="el-c-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "28px 28px 22px",
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>
                Browse Courses
              </div>
              <h2 style={{ margin: "8px 0 0", fontSize: 30, color: C.text, letterSpacing: "-0.6px" }}>
                Choose your next learning track
              </h2>
            </div>

            <div className="el-c-controls" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <Search size={15} color={C.textMuted} style={{ position: "absolute", left: 12, top: 12 }} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title or category"
                  style={{
                    width: 240,
                    height: 40,
                    borderRadius: 999,
                    border: `1px solid ${C.border}`,
                    background: C.white,
                    padding: "0 14px 0 36px",
                    fontSize: 13,
                    color: C.text,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SlidersHorizontal size={15} color={C.textMuted} />
                {(["all", "free", "paid"] as const).map((item) => {
                  const active = filter === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFilter(item)}
                      style={{
                        height: 38,
                        padding: "0 14px",
                        borderRadius: 999,
                        border: active ? `1px solid ${C.dark}` : `1px solid ${C.border}`,
                        background: active ? C.dark : C.white,
                        color: active ? C.white : C.textSec,
                        fontSize: 12.5,
                        fontWeight: 700,
                        textTransform: "capitalize",
                        cursor: "pointer",
                      }}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error ? (
            <div style={{ padding: "0 28px 18px" }}>
              <div style={{ borderRadius: 14, background: C.errorBg, color: C.errorText, padding: "12px 14px", fontSize: 13 }}>
                {error}
              </div>
            </div>
          ) : null}

          <div style={{ padding: "0 0 28px" }}>
            {loading ? (
              <div style={{ padding: "0 28px", color: C.textSec, fontSize: 14 }}>Loading courses...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "0 28px", color: C.textSec, fontSize: 14 }}>
                No courses matched your search.
              </div>
            ) : (
              filtered.map((course, index) => {
                const tone = stateTone(course.state);
                return (
                  <Link
                    key={course.id}
                    href={`/elearning/${course.slug}`}
                    className="el-c-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "56px 1.1fr 0.9fr auto",
                      gap: 18,
                      alignItems: "start",
                      padding: "24px 28px",
                      textDecoration: "none",
                      borderTop: index === 0 ? `1px solid ${C.borderSubtle}` : "none",
                      borderBottom: `1px solid ${C.borderSubtle}`,
                      color: C.text,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: `${course.accent}16`,
                        border: `1px solid ${course.accent}35`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: shadow.elev1,
                      }}
                    >
                      <BookOpen size={18} color={course.accent} />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 7 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.55px", textTransform: "uppercase", color: C.textMuted }}>
                          {course.category}
                        </span>
                        <span style={{ fontSize: 11.5, color: C.textSec, background: C.whisper, borderRadius: 999, padding: "4px 8px" }}>
                          {course.level}
                        </span>
                        <span style={{ fontSize: 11.5, color: C.gold, background: C.goldWhisper, borderRadius: 999, padding: "4px 8px" }}>
                          {course.amountLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.45px", lineHeight: 1.06, marginBottom: 8 }}>
                        {course.title}
                      </div>
                      <div style={{ fontSize: 13.5, color: C.textSec, lineHeight: 1.65, maxWidth: 540 }}>
                        {course.description}
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 12, paddingTop: 2 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.55px", textTransform: "uppercase", color: C.textMuted, marginBottom: 4 }}>
                            Duration
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: C.textSec }}>
                            <Clock3 size={13} color={C.textMuted} />
                            {course.durationLabel}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.55px", textTransform: "uppercase", color: C.textMuted, marginBottom: 4 }}>
                            Modules
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: C.textSec }}>
                            <BookOpen size={13} color={C.textMuted} />
                            {course.totalModules}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: tone.fg,
                            background: tone.bg,
                            borderRadius: 999,
                            padding: "4px 9px",
                          }}
                        >
                          {tone.label}
                        </span>
                        {course.certificateEnabled ? (
                          <span style={{ fontSize: 11, color: C.textSec, display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <Award size={12} color={C.gold} /> Certificate track
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifySelf: "end", paddingTop: 4 }}>
                      <span
                        className="el-c-cta"
                        style={{
                          height: 40,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "0 14px",
                          borderRadius: 999,
                          border: `1px solid ${C.borderStrong}`,
                          color: C.primary,
                          background: C.whisper,
                          fontSize: 12.5,
                          fontWeight: 700,
                        }}
                      >
                        Review Course <ChevronRight size={14} />
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
