"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Microscope, Shield, Users } from "lucide-react";
import { Navbar } from "@/components/layout/navbar/Navbar";
import heroImage from "../../portal_images/founder_holding_soil.jpeg";

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
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
} as const;

const pathways = [
  {
    title: "Postgraduate Programmes",
    href: "/postgraduate",
    icon: <GraduationCap size={16} />,
    label: "Admissions",
    status: "Applications Open",
    deadline: "30 Sep 2026",
    metric: "10+ MSc tracks",
    detail: "MSc pathways in Food Science, Agriculture, Environment, and Economics.",
  },
  {
    title: "Professional Training",
    href: "/training",
    icon: <Users size={16} />,
    label: "Cohorts",
    status: "March Intake",
    deadline: "Limited Seats",
    metric: "Field cohorts",
    detail: "Field-ready short courses for extension workers, farmers, and agribusiness teams.",
  },
  {
    title: "E-Learning",
    href: "/elearning",
    icon: <BookOpen size={16} />,
    label: "Digital Learning",
    status: "Always Available",
    deadline: "Self-Paced",
    metric: "Certificates",
    detail: "Structured online modules with certificate pathways and progress tracking.",
  },
  {
    title: "Research & Innovation",
    href: "/postgraduate",
    icon: <Microscope size={16} />,
    label: "Research",
    status: "Ongoing",
    deadline: "Year-Round",
    metric: "Food systems",
    detail: "Applied research focus on food systems resilience across Nigeria.",
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100dvh", background: C.canvas, fontFamily: "var(--font-sans)" }}>
      <style>{`
        .home-shell {
          width: min(1220px, calc(100% - 56px));
          margin: 0 auto;
        }
        .home-hero {
          margin-top: 26px;
          border-radius: 30px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          border: 1px solid rgba(216,228,216,0.85);
          box-shadow: 0 22px 70px rgba(45,90,45,0.12);
          background: ${C.white};
        }
        .home-hero-copy {
          padding: 54px 52px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid ${C.borderSubtle};
          position: relative;
          z-index: 2;
        }
        .home-hero-image {
          min-height: 440px;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .home-hero-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15,34,16,0.06), rgba(15,34,16,0.52));
        }
        .home-hero-title {
          margin: 0;
          font-size: clamp(34px, 5vw, 52px);
          line-height: 1.02;
          letter-spacing: -0.03em;
          color: ${C.text};
          text-wrap: balance;
        }
        .pathways-panel {
          margin-top: 34px;
          border-radius: 24px;
          border: 1px solid ${C.borderSubtle};
          background: linear-gradient(180deg, ${C.white}, rgba(255,255,255,0.76));
          box-shadow: 0 16px 44px rgba(45,90,45,0.1);
          overflow: hidden;
        }
        .pathways-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 14px;
          padding: 18px;
        }
        .pathway-card {
          text-decoration: none;
          border-radius: 18px;
          padding: 18px;
          min-height: 176px;
          background: ${C.white};
          border: 1px solid ${C.borderSubtle};
          box-shadow: 0 10px 24px rgba(45,90,45,0.07);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
          transition: box-shadow 180ms ease-out, transform 180ms ease-out, background 160ms ease-out;
        }
        .pathway-card:first-child {
          min-height: 214px;
          background: radial-gradient(circle at 90% 8%, rgba(168,212,168,0.28), transparent 34%), ${C.white};
        }
        .pathway-card:hover {
          background: ${C.whisper};
          box-shadow: 0 18px 40px rgba(45,90,45,0.12);
          transform: translateY(-2px);
        }
        .pathway-card:focus-visible {
          outline: 2px solid ${C.primary};
          outline-offset: 3px;
        }
        .pathway-card__top {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .pathway-card__icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: ${C.whisper};
          color: ${C.primary};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pathway-card__label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${C.textMuted};
        }
        .pathway-card__title {
          margin-top: 5px;
          font-size: 19px;
          font-weight: 800;
          color: ${C.text};
          letter-spacing: -0.02em;
        }
        .pathway-card__detail {
          margin-top: 8px;
          font-size: 13px;
          color: ${C.textSec};
          line-height: 1.6;
        }
        .pathway-card__meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pathway-chip {
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 800;
          color: ${C.primary};
          background: ${C.whisper};
        }
        .pathway-deadline {
          font-size: 12px;
          color: ${C.textSec};
        }
        .pathway-arrow {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: ${C.canvas};
          color: ${C.primary};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 160ms ease-out, background 160ms ease-out;
        }
        .pathway-card:hover .pathway-arrow {
          transform: translateX(3px);
          background: ${C.white};
        }
        .proof-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .proof-card {
          border: 1px solid ${C.borderSubtle};
          border-radius: 14px;
          background: ${C.white};
          padding: 16px;
        }
        @media (max-width: 980px) {
          .home-shell { width: calc(100% - 30px); }
          .home-hero { grid-template-columns: 1fr; }
          .home-hero-copy { border-right: none; border-bottom: 1px solid ${C.borderSubtle}; padding: 34px 24px; }
          .home-hero-image { min-height: 220px; }
          .pathways-grid { grid-template-columns: 1fr; }
          .proof-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .home-shell { width: calc(100% - 24px); }
          .home-hero {
            margin-top: 16px;
            border-radius: 22px;
            position: relative;
            min-height: 60dvh;
            align-items: stretch;
          }
          .home-hero-copy {
            position: absolute;
            inset: 0;
            padding: 24px 18px;
            border-right: none;
            border-bottom: none;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            z-index: 3;
            color: ${C.white};
          }
          .home-hero-copy > div:first-child {
            max-width: 92%;
          }
          .home-hero-title {
            font-size: clamp(31px, 9vw, 38px);
            line-height: 1.06;
            color: ${C.white};
          }
          .home-hero-break { display: none; }
          .home-hero-image {
            min-height: 60dvh;
          }
          .home-hero-image::after {
            background: linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.52));
          }
          .home-hero-eyebrow-line {
            background: rgba(255,255,255,0.7) !important;
          }
          .home-hero-eyebrow-text {
            color: rgba(255,255,255,0.95) !important;
          }
          .home-hero-subtext {
            color: rgba(255,255,255,0.88) !important;
            max-width: 560px !important;
          }
          .home-hero-actions { display: grid !important; grid-template-columns: 1fr; }
          .home-hero-actions a { width: 100%; justify-content: center; }
          .home-hero-actions a:last-child {
            border-color: rgba(255,255,255,0.5) !important;
            color: ${C.white} !important;
            background: rgba(255,255,255,0.08) !important;
          }
          .pathways-panel { margin-top: 22px; border-radius: 20px; }
          .pathways-grid { padding: 12px; gap: 12px; }
          .pathway-card { min-height: auto; padding: 16px; border-radius: 16px; }
          .pathway-card:first-child { min-height: auto; }
          .proof-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <Navbar activePage="home" />

      <main className="home-shell">
        <section className="home-hero">
          <div className="home-hero-copy">
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                <div className="home-hero-eyebrow-line" style={{ width: 24, height: 1, background: C.primary }} />
                <span className="home-hero-eyebrow-text" style={{ fontSize: 11, fontWeight: 700, color: C.primary, letterSpacing: "1px", textTransform: "uppercase" }}>
                  TETFund Centre of Excellence in Food Security
                </span>
              </div>
              <h1 className="home-hero-title">
                Institutional learning,
                <br className="home-hero-break" />
                admissions, and training.
              </h1>
              <p className="home-hero-subtext" style={{ margin: "18px 0 0", maxWidth: 560, color: C.textSec, lineHeight: 1.75, fontSize: 16 }}>
                The TCoEFS Portal is the official gateway for postgraduate applications, professional training enrolment, and e-learning access at the University of Jos.
              </p>
            </div>

            <div className="home-hero-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 26 }}>
              <Link href="/postgraduate" style={{ height: 48, padding: "0 20px", borderRadius: 10, border: "none", background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, textDecoration: "none", fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
                Start Application
                <ArrowRight size={15} />
              </Link>
              <Link href="/training" style={{ height: 48, padding: "0 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "transparent", color: C.text, textDecoration: "none", fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center" }}>
                Explore Training
              </Link>
            </div>
          </div>

          <div className="home-hero-image" style={{ backgroundImage: `url(${heroImage.src})` }} aria-hidden="true" />
        </section>

        <section className="pathways-panel">
          <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${C.borderSubtle}` }}>
            <h2 style={{ margin: 0, fontSize: 20, color: C.text, letterSpacing: "-0.3px" }}>Pathways</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
              Choose the pathway that matches your objective and timeline.
            </p>
          </div>
          <div className="pathways-grid">
            {pathways.map((item) => (
              <Link key={item.title} href={item.href} className="pathway-card">
                <div className="pathway-card__top">
                  <div className="pathway-card__icon">
                  {item.icon}
                  </div>
                  <div>
                    <div className="pathway-card__label">{item.label}</div>
                    <div className="pathway-card__title">{item.title}</div>
                    <div className="pathway-card__detail">{item.detail}</div>
                  </div>
                </div>
                <div className="pathway-card__meta">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="pathway-chip">{item.status}</span>
                    <span className="pathway-deadline">{item.metric} · {item.deadline}</span>
                  </div>
                  <span className="pathway-arrow"><ArrowRight size={15} /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28, marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: C.text }}>Institutional Signals</h3>
            <div style={{ fontSize: 12, color: C.textMuted }}>University of Jos · TETFund CoE</div>
          </div>
          <div className="proof-grid">
            {[
              { title: "Programmes", value: "10+ MSc tracks", note: "Food systems and agricultural science" },
              { title: "Training", value: "Open cohorts", note: "Hands-on professional courses" },
              { title: "E-Learning", value: "Certificate pathways", note: "Self-paced and instructor-led" },
              { title: "Support", value: "Admissions helpdesk", note: "Application and payment guidance" },
            ].map((block) => (
              <div key={block.title} className="proof-card">
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>{block.title}</div>
                <div style={{ marginTop: 8, fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: C.text }}>{block.value}</div>
                <div style={{ marginTop: 4, fontSize: 12.5, color: C.textSec, lineHeight: 1.5 }}>{block.note}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textMuted }}>
          <Shield size={12} />
          TETFund Centre of Excellence in Food Security · University of Jos
        </div>
      </main>
    </div>
  );
}
