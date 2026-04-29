"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Clock3, Filter, Layers, MapPin, Sprout, Users, Wallet } from "lucide-react";
import type { PublicTrainingListItem } from "@/features/training/catalogue";

const C = {
  dark: "#1A3A1A",
  darkest: "#0F2210",
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

const trainingImages = {
  foodProcessing: "/images/training/food-processing.jpg",
  agribusiness: "/images/training/agribusiness.jpg",
  climateSmart: "/images/training/climate-smart-agriculture.jpg",
  cropScience: "/images/training/crop-science.jpg",
  waterManagement: "/images/training/water-management.jpg",
  livestockSystems: "/images/training/livestock-systems.jpg",
} as const;

function trainingIdentity(row: PublicTrainingListItem) {
  const text = `${row.title} ${row.category} ${row.mode}`.toLowerCase();
  if (text.includes("food") || text.includes("haccp") || text.includes("safety") || text.includes("processing")) {
    return {
      label: "Food Safety",
      image: trainingImages.foodProcessing,
      tint: "#F4EFE2",
      accent: "#7A5A18",
      detail: "Quality systems, standards, and safer processing workflows.",
    };
  }
  if (text.includes("livestock") || text.includes("animal") || text.includes("goat") || text.includes("poultry")) {
    return {
      label: "Livestock Systems",
      image: trainingImages.livestockSystems,
      tint: "#EEF4EA",
      accent: "#496735",
      detail: "Animal health, production systems, and farm resilience.",
    };
  }
  if (text.includes("irrigation") || text.includes("water")) {
    return {
      label: "Water Management",
      image: trainingImages.waterManagement,
      tint: "#E7F1EC",
      accent: "#2F6652",
      detail: "Practical field water-use planning and conservation.",
    };
  }
  if (text.includes("climate")) {
    return {
      label: "Climate-Smart Agriculture",
      image: trainingImages.climateSmart,
      tint: "#EAF4EA",
      accent: C.primary,
      detail: "Resilient practices for farms, soil, water, and local systems.",
    };
  }
  if (text.includes("crop") || text.includes("seed") || text.includes("production")) {
    return {
      label: "Crop Science",
      image: trainingImages.cropScience,
      tint: "#EDF6E9",
      accent: "#3F7B36",
      detail: "Applied production, field practice, and yield improvement.",
    };
  }
  if (text.includes("market") || text.includes("business") || text.includes("agribusiness")) {
    return {
      label: "Agribusiness",
      image: trainingImages.agribusiness,
      tint: "#F2F0E7",
      accent: "#5D6B2F",
      detail: "Enterprise, value chains, market access, and practical planning.",
    };
  }
  return {
    label: "Professional Training",
    image: trainingImages.agribusiness,
    tint: C.whisper,
    accent: C.primary,
    detail: "Field-ready skills for food security practitioners.",
  };
}

function MetaItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="tr-meta-item">
      <span className="tr-meta-icon" aria-hidden="true">{icon}</span>
      <span>
        <span className="tr-meta-label">{label}</span>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

export function PublicTrainingCatalogue({ rows }: { rows: PublicTrainingListItem[] }) {
  const categoryFilters = useMemo(() => ["All", ...Array.from(new Set(rows.map((item) => item.category)))], [rows]);
  const modeFilters = useMemo(() => ["All", ...Array.from(new Set(rows.map((item) => item.mode)))], [rows]);
  const [category, setCategory] = useState("All");
  const [mode, setMode] = useState("All");

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      const categoryMatch = category === "All" || item.category === category;
      const modeMatch = mode === "All" || item.mode === mode;
      return categoryMatch && modeMatch;
    });
  }, [category, mode, rows]);

  return (
    <>
      <style>{`
        .tr-shell {
          width: min(1220px, calc(100% - 48px));
          margin: 0 auto;
          padding-bottom: 34px;
        }
        .tr-main {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 14px;
        }
        .tr-panel {
          border: 1px solid ${C.borderSubtle};
          border-radius: 14px;
          background: ${C.white};
        }
        .tr-filter-panel {
          align-self: start;
          position: sticky;
          top: calc(var(--navbar-height, 64px) + 14px);
          padding: 14px;
        }
        .tr-filter-btn {
          width: 100%;
          border: 1px solid ${C.border};
          border-radius: 10px;
          background: ${C.white};
          color: ${C.textSec};
          font-size: 12.5px;
          text-align: left;
          padding: 9px 10px;
          cursor: pointer;
        }
        .tr-filter-btn.active {
          border-color: ${C.primary};
          color: ${C.primary};
          background: ${C.whisper};
          font-weight: 700;
        }
        .tr-card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .tr-card {
          min-width: 0;
          overflow: hidden;
          border: 1px solid ${C.borderSubtle};
          border-radius: 22px;
          background: ${C.white};
          color: inherit;
          text-decoration: none;
          box-shadow: 0 14px 34px rgba(45,90,45,0.08);
          display: grid;
          transition: transform 180ms ease-out, box-shadow 180ms ease-out, border-color 180ms ease-out;
        }
        .tr-card:hover {
          transform: translateY(-2px);
          border-color: ${C.border};
          box-shadow: 0 20px 46px rgba(45,90,45,0.13);
        }
        .tr-card:focus-visible {
          outline: 2px solid ${C.primary};
          outline-offset: 3px;
        }
        .tr-card__media {
          min-height: 154px;
          position: relative;
          background-size: cover;
          background-position: center;
        }
        .tr-card__media::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15,34,16,0.04), rgba(15,34,16,0.68));
        }
        .tr-card__badge-row {
          position: absolute;
          inset: 12px 12px auto 12px;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .tr-topic-pill,
        .tr-status-pill {
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
        .tr-topic-pill {
          color: ${C.white};
          background: rgba(15,34,16,0.56);
          border: 1px solid rgba(255,255,255,0.16);
        }
        .tr-status-pill {
          background: rgba(255,255,255,0.9);
        }
        .tr-card__content {
          padding: 16px;
          display: grid;
          gap: 14px;
        }
        .tr-card__top {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .tr-card__mark {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }
        .tr-card__mark svg,
        .tr-meta-icon svg {
          width: 16px;
          height: 16px;
          stroke-width: 1.9;
        }
        .tr-card__title {
          margin: 0;
          color: ${C.text};
          font-size: 18px;
          line-height: 1.22;
          letter-spacing: -0.02em;
        }
        .tr-card__detail {
          margin-top: 7px;
          color: ${C.textSec};
          font-size: 12.5px;
          line-height: 1.6;
        }
        .tr-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .tr-meta-item {
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
        .tr-meta-icon {
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
        .tr-meta-label {
          display: block;
          margin-bottom: 2px;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: ${C.textMuted};
        }
        .tr-meta-item strong {
          display: block;
          color: ${C.textSec};
          font-size: 12.5px;
          font-weight: 650;
        }
        .tr-card__cta {
          height: 42px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: ${C.primary};
          background: ${C.whisper};
          font-size: 13px;
          font-weight: 800;
        }
        .tr-card__cta svg {
          width: 15px;
          height: 15px;
        }
        @media (max-width: 1040px) {
          .tr-shell { width: calc(100% - 28px); }
          .tr-main { grid-template-columns: 1fr; }
          .tr-filter-panel { position: static; }
          .tr-filter-group { display: flex !important; gap: 8px !important; overflow-x: auto; padding-bottom: 2px; }
          .tr-filter-btn { width: auto; flex: 0 0 auto; white-space: nowrap; }
        }
        @media (max-width: 760px) {
          .tr-card-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .tr-shell { width: calc(100% - 24px); }
          .tr-main { margin-top: 14px; }
          .tr-card__media { min-height: 138px; }
          .tr-meta-grid { grid-template-columns: 1fr; }
          .tr-card__title { font-size: 17px; }
          .tr-card__content { padding: 14px; }
        }
      `}</style>

      <main className="tr-shell">
        <section
          style={{
            marginTop: 22,
            borderRadius: 20,
            border: `1px solid rgba(255,255,255,0.1)`,
            background: `linear-gradient(145deg, ${C.dark} 0%, ${C.darkest} 58%, #1f3e1f 100%)`,
            color: "rgba(255,255,255,0.92)",
            padding: "32px 26px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", opacity: 0.58, marginBottom: 10 }}>
            Professional Training Catalogue
          </div>
          <h1 style={{ margin: 0, fontSize: 40, letterSpacing: "-1px", lineHeight: 1.08 }}>
            Short courses with practical field outcomes.
          </h1>
          <p style={{ margin: "12px 0 0", maxWidth: 760, fontSize: 15.5, lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>
            Filter courses by category and delivery mode, compare dates and fees, then open a programme row for full training details and registration.
          </p>
        </section>

        <section className="tr-main">
          <aside className="tr-panel tr-filter-panel">
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textSec, marginBottom: 12 }}>
              <Filter size={14} />
              Filters
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted, marginBottom: 7 }}>
                Category
              </div>
              <div className="tr-filter-group" style={{ display: "grid", gap: 7 }}>
                {categoryFilters.map((item) => (
                  <button key={item} type="button" className={`tr-filter-btn ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted, marginBottom: 7 }}>
                Mode
              </div>
              <div className="tr-filter-group" style={{ display: "grid", gap: 7 }}>
                {modeFilters.map((item) => (
                  <button key={item} type="button" className={`tr-filter-btn ${mode === item ? "active" : ""}`} onClick={() => setMode(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="tr-card-grid">
            {filteredRows.map((row) => {
              const warning = row.status === "Closing Soon";
              const identity = trainingIdentity(row);
              return (
                <Link key={row.slug} href={`/training/${row.slug}`} className="tr-card">
                  <div className="tr-card__media" style={{ backgroundImage: `url(${identity.image})` }}>
                    <div className="tr-card__badge-row">
                      <span className="tr-topic-pill">{identity.label}</span>
                      <span className="tr-status-pill" style={{ color: warning ? C.warningText : C.successText }}>
                        {row.status}
                      </span>
                    </div>
                  </div>

                  <div className="tr-card__content">
                    <div className="tr-card__top">
                      <span className="tr-card__mark" style={{ background: identity.tint, color: identity.accent }} aria-hidden="true">
                        <Sprout />
                      </span>
                      <div>
                        <h2 className="tr-card__title">{row.title}</h2>
                        <p className="tr-card__detail">{identity.detail}</p>
                      </div>
                    </div>

                    <div className="tr-meta-grid">
                      <MetaItem icon={<Layers />} label="Category" value={row.category} />
                      <MetaItem icon={<MapPin />} label="Mode" value={row.mode} />
                      <MetaItem icon={<Calendar />} label="Dates" value={row.dates} />
                      <MetaItem icon={<Clock3 />} label="Duration" value={row.duration} />
                      <MetaItem icon={<Wallet />} label="Fee" value={row.fee} />
                      <MetaItem icon={<Users />} label="Seats" value={row.seats} />
                    </div>

                    <span className="tr-card__cta">
                      View training details
                      <ArrowRight />
                    </span>
                  </div>
                </Link>
              );
            })}

            {filteredRows.length === 0 ? (
              <div className="tr-panel" style={{ padding: "28px 16px", textAlign: "center", fontSize: 13, color: C.textMuted }}>
                No programmes match the selected filters.
              </div>
            ) : null}
          </section>
        </section>
      </main>
    </>
  );
}
