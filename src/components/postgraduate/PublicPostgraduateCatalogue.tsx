"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Calendar, GraduationCap, Layers, Microscope, Wallet } from "lucide-react";
import type { PublicPostgraduateListItem } from "@/features/postgraduate/catalogue";
import soilImage from "../../../portal_images/founder_holding_soil.jpeg";
import grainsImage from "../../../portal_images/hand_holding_grains.jpeg";
import livestockImage from "../../../portal_images/tending_to_livestocks.jpeg";
import goatsImage from "../../../portal_images/feeding_goats.jpeg";
import rabbitsImage from "../../../portal_images/rabbits.jpeg";
import founderImage from "../../../portal_images/founder_holding_club.jpg";

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
  successBg: "#DCFCE7",
  successText: "#166534",
  warningBg: "#FEF3C7",
  warningText: "#92400E",
} as const;

function programmeIdentity(programme: PublicPostgraduateListItem) {
  const text = `${programme.title} ${programme.code}`.toLowerCase();
  if (text.includes("livestock") || text.includes("animal")) {
    return {
      label: "Livestock Science",
      image: livestockImage.src,
      tint: "#EEF4EA",
      accent: "#496735",
      detail: "Animal systems, health, production, and climate resilience.",
    };
  }
  if (text.includes("seed")) {
    return {
      label: "Seed Systems",
      image: grainsImage.src,
      tint: "#F4EFE2",
      accent: "#7A5A18",
      detail: "Seed quality, technology, plant genetics, and productivity.",
    };
  }
  if (text.includes("crop") || text.includes("protection")) {
    return {
      label: "Crop Protection",
      image: goatsImage.src,
      tint: "#EDF6E9",
      accent: "#3F7B36",
      detail: "Pest, disease, weed, and integrated field protection systems.",
    };
  }
  if (text.includes("communication") || text.includes("extension")) {
    return {
      label: "Agricultural Communication",
      image: founderImage.src,
      tint: "#F1F3E8",
      accent: "#5D6B2F",
      detail: "Knowledge systems, advisory services, and science communication.",
    };
  }
  if (text.includes("gender") || text.includes("rural")) {
    return {
      label: "Rural Development",
      image: rabbitsImage.src,
      tint: "#F2F0E7",
      accent: "#6B5B35",
      detail: "Inclusive agriculture, communities, and rural transformation.",
    };
  }
  if (text.includes("economics") || text.includes("mba") || text.includes("business") || text.includes("market")) {
    return {
      label: "Policy & Markets",
      image: founderImage.src,
      tint: "#F7F4E8",
      accent: "#746323",
      detail: "Agribusiness, food systems economics, markets, and enterprise.",
    };
  }
  if (text.includes("climate") || text.includes("disaster") || text.includes("environment")) {
    return {
      label: "Climate & Resilience",
      image: soilImage.src,
      tint: "#EAF4EA",
      accent: C.primary,
      detail: "Climate risk, disaster management, resilience, and adaptation.",
    };
  }
  if (text.includes("food")) {
    return {
      label: "Food Systems",
      image: grainsImage.src,
      tint: "#E8F5E8",
      accent: C.primary,
      detail: "Food security, sustainable systems, and applied research.",
    };
  }
  if (text.includes("agric")) {
    return {
      label: "Agricultural Science",
      image: goatsImage.src,
      tint: "#EDF7ED",
      accent: "#3F7B36",
      detail: "Agricultural practice, research methods, and field systems.",
    };
  }
  return {
    label: "Postgraduate",
    image: soilImage.src,
    tint: C.whisper,
    accent: C.primary,
    detail: "Advanced TCoEFS study pathway for food security professionals.",
  };
}

function MetaItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="pg-meta-item">
      <span className="pg-meta-icon" aria-hidden="true">{icon}</span>
      <span>
        <span className="pg-meta-label">{label}</span>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

export function PublicPostgraduateCatalogue({ programmes }: { programmes: PublicPostgraduateListItem[] }) {
  return (
    <>
      <style>{`
        .pg-shell {
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
        }
        .pg-hero {
          margin-top: 24px;
          border-radius: 20px;
          padding: 34px 30px;
          background: linear-gradient(140deg, ${C.dark} 0%, ${C.darkest} 58%, #1f3e1f 100%);
          color: rgba(255,255,255,0.92);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .pg-grid {
          margin-top: 20px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .pg-row {
          display: grid;
          min-width: 0;
          overflow: hidden;
          border: 1px solid ${C.borderSubtle};
          border-radius: 22px;
          background: ${C.white};
          box-shadow: 0 14px 34px rgba(45,90,45,0.08);
          text-decoration: none;
          color: inherit;
          transition: transform 180ms ease-out, box-shadow 180ms ease-out, border-color 180ms ease-out;
        }
        .pg-row:hover {
          transform: translateY(-2px);
          border-color: ${C.border};
          box-shadow: 0 20px 46px rgba(45,90,45,0.13);
        }
        .pg-row:focus-visible { outline: 2px solid ${C.primary}; outline-offset: 3px; }
        .pg-card-media {
          min-height: 156px;
          position: relative;
          background-size: cover;
          background-position: center;
        }
        .pg-card-media::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15,34,16,0.04), rgba(15,34,16,0.68));
        }
        .pg-card-badges {
          position: absolute;
          inset: 12px 12px auto 12px;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .pg-topic-pill,
        .pg-status-pill {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0 10px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          backdrop-filter: blur(12px);
        }
        .pg-topic-pill {
          color: ${C.white};
          background: rgba(15,34,16,0.56);
          border: 1px solid rgba(255,255,255,0.16);
        }
        .pg-status-pill {
          background: rgba(255,255,255,0.9);
        }
        .pg-card-content {
          padding: 16px;
          display: grid;
          gap: 14px;
        }
        .pg-programme-title { margin: 0; font-size: 18px; line-height: 1.22; letter-spacing: -0.02em; font-weight: 800; color: ${C.text}; }
        .pg-identity { display: flex; align-items: flex-start; gap: 11px; min-width: 0; }
        .pg-identity-mark { width: 40px; height: 40px; border-radius: 14px; background: ${C.whisper}; color: ${C.primary}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pg-identity-mark svg,
        .pg-meta-icon svg { width: 16px; height: 16px; stroke-width: 1.9; }
        .pg-discipline { font-size: 10.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: ${C.primary}; margin-bottom: 4px; }
        .pg-card-detail { margin-top: 7px; color: ${C.textSec}; font-size: 12.5px; line-height: 1.6; }
        .pg-card-subline { margin-top: 7px; color: ${C.textMuted}; font-size: 12px; line-height: 1.4; }
        .pg-mobile-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .pg-meta-item {
          min-width: 0;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          border-radius: 14px;
          background: ${C.canvas};
          padding: 10px;
          color: ${C.textSec};
          font-size: 12px;
          line-height: 1.4;
        }
        .pg-meta-icon {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          background: ${C.white};
          color: ${C.primary};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }
        .pg-meta-label { display: block; margin-bottom: 2px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase; color: ${C.textMuted}; }
        .pg-meta-item strong { display: block; color: ${C.textSec}; font-size: 12.5px; font-weight: 650; }
        .pg-cta { height: 42px; border-radius: 13px; background: ${C.whisper}; color: ${C.primary}; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 800; }
        .pg-cta svg { width: 15px; height: 15px; }
        @media (max-width: 980px) {
          .pg-shell { width: calc(100% - 28px); }
          .pg-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .pg-shell { width: calc(100% - 24px); }
          .pg-hero { padding: 26px 18px; border-radius: 18px; }
          .pg-hero h1 { font-size: 31px !important; line-height: 1.08 !important; }
          .pg-card-media { min-height: 138px; }
          .pg-card-content { padding: 14px; }
          .pg-programme-title { font-size: 17px; }
          .pg-mobile-meta { grid-template-columns: 1fr; }
        }
      `}</style>

      <main className="pg-shell" style={{ paddingBottom: 34 }}>
        <section className="pg-hero">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", opacity: 0.58, marginBottom: 12 }}>
            Admissions 2026
          </div>
          <h1 style={{ margin: 0, fontSize: 42, letterSpacing: "-1.2px", lineHeight: 1.05 }}>
            Postgraduate Programme Browser
          </h1>
          <p style={{ margin: "12px 0 0", maxWidth: 740, fontSize: 15.5, lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>
            Compare programme options by status, deadline, mode, and application fee. Select a programme to view its digital prospectus and application requirements.
          </p>
        </section>

        <section className="pg-grid">
          {programmes.map((p) => {
            const identity = programmeIdentity(p);
            return (
            <Link key={p.slug} href={`/postgraduate/${p.slug}`} className="pg-row">
              <div className="pg-card-media" style={{ backgroundImage: `url(${identity.image})` }}>
                <div className="pg-card-badges">
                  <span className="pg-topic-pill">{identity.label}</span>
                  <span className="pg-status-pill" style={{ color: p.status === "Closing Soon" ? C.warningText : C.successText }}>
                    {p.status}
                  </span>
                </div>
              </div>

              <div className="pg-card-content">
                <div className="pg-identity">
                  <div className="pg-identity-mark" style={{ background: identity.tint, color: identity.accent }}>
                    <GraduationCap />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="pg-discipline" style={{ color: identity.accent }}>{identity.label}</div>
                    <h2 className="pg-programme-title">{p.title}</h2>
                    <p className="pg-card-detail">{identity.detail}</p>
                    <div className="pg-card-subline">{p.code} · {p.duration}</div>
                  </div>
                </div>

                <div className="pg-mobile-meta">
                  <MetaItem icon={<Calendar />} label="Deadline" value={p.deadline} />
                  <MetaItem icon={<Layers />} label="Mode" value={p.mode} />
                  <MetaItem icon={<Wallet />} label="Fee" value={p.fee} />
                  <MetaItem icon={<Microscope />} label="Pathway" value={identity.label} />
                </div>

                <span className="pg-cta">
                  View programme details
                  <ArrowRight />
                </span>
              </div>
            </Link>
            );
          })}
        </section>

        <section style={{ marginTop: 18, borderRadius: 14, border: `1px solid ${C.borderSubtle}`, background: C.white, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.6 }}>
            {"Application workflow: select programme -> create account -> complete form -> upload documents -> generate RRR -> submit."}
          </div>
          <Link href="/register" style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "none", background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, textDecoration: "none", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8 }}>
            Create Account
            <ArrowRight size={14} />
          </Link>
        </section>
      </main>
    </>
  );
}
