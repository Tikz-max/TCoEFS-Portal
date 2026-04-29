import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  Check,
  Clock,
  Globe,
  MapPin,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar/Navbar";
import { getPublicTrainingDetailBySlug } from "@/features/training/catalogue";

const C = {
  darkest: "#0F2210",
  dark: "#1A3A1A",
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  whisper: "#E8F5E8",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  gold: "#C49A26",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
} as const;

const shadow = {
  elev1:
    "inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev2:
    "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12), 0 8px 16px rgba(45,90,45,0.08)",
} as const;

function iconForDetail(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("date") || lower.includes("deadline")) return <Calendar size={12} color={C.primary} />;
  if (lower.includes("duration")) return <Clock size={13} color={C.primary} />;
  if (lower.includes("mode")) return <Globe size={12} color={C.primary} />;
  if (lower.includes("venue")) return <MapPin size={12} color={C.primary} />;
  if (lower.includes("seat")) return <Award size={12} color={C.gold} />;
  return <Building2 size={12} color={C.primary} />;
}

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const training = await getPublicTrainingDetailBySlug(resolved.slug);
  if (!training) notFound();

  const registerPath = `/training/register/1?programme=${encodeURIComponent(training.slug)}`;
  const loginPath = `/login?redirect=${encodeURIComponent(registerPath)}`;

  return (
    <div style={{ minHeight: "100dvh", background: C.canvas, fontFamily: "var(--font-sans)" }}>
      <Navbar activePage="training" />

      <style>{`
        .td-shell {
          width: min(1220px, calc(100% - 48px));
          margin: 0 auto;
          padding-bottom: 34px;
        }
        .td-main {
          margin-top: 16px;
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.55fr);
          gap: 16px;
        }
        .td-panel {
          background: ${C.white};
          border: 1px solid ${C.borderSubtle};
          border-radius: 18px;
          overflow: hidden;
          box-shadow: ${shadow.elev2};
        }
        .td-detail-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        @media (max-width: 980px) {
          .td-shell { width: calc(100% - 28px); }
          .td-main { grid-template-columns: minmax(0, 1fr); }
          .td-detail-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>

      <main className="td-shell">
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Link href="/training" style={{ fontSize: 13, color: C.primary, textDecoration: "none", fontWeight: 700 }}>
            {"<- All training programmes"}
          </Link>
          <div style={{ fontSize: 12, color: C.textMuted }}>
            Home / Training / {training.breadcrumbLabel}
          </div>
        </div>

        <section style={{ marginTop: 10, borderRadius: 18, border: `1px solid ${C.borderSubtle}`, background: C.white, overflow: "hidden" }}>
          <div style={{ background: `linear-gradient(140deg, ${C.dark} 0%, ${C.darkest} 60%, #1f3e1f 100%)`, color: "rgba(255,255,255,0.92)", padding: "24px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: training.categoryColor, background: training.categoryBg, padding: "3px 8px", borderRadius: 999 }}>
                {training.categoryLabel}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: training.statusColor, background: training.statusBg, padding: "3px 8px", borderRadius: 999 }}>
                {training.statusLabel}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 34, letterSpacing: "-0.8px", lineHeight: 1.08 }}>{training.title}</h1>
          </div>
        </section>

        <div className="td-main">
          <div className="td-panel" style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                Programme Overview
              </h2>
              <p style={{ fontSize: 13, color: C.textSec, margin: 0, lineHeight: 1.65 }}>
                {training.overview}
              </p>
            </div>

            <div className="td-detail-grid">
              {training.keyDetails.map((item) => (
                <div key={item.label} style={{ background: C.white, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.borderSubtle}`, boxShadow: shadow.elev1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    {iconForDetail(item.label)}
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                Learning Outcomes
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {training.outcomes.map((item) => (
                  <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.whisper, border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Check size={9} color={C.primary} />
                    </div>
                    <p style={{ fontSize: 12, color: C.textSec, margin: 0, lineHeight: 1.55 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                Who Should Attend
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {training.audience.map((item) => (
                  <span key={item} style={{ fontSize: 11, fontWeight: 500, color: C.textSec, background: C.white, padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border}`, boxShadow: shadow.elev1 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="td-panel" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            {training.feeType === "tiered" ? (
              <div style={{ background: C.canvas, borderRadius: 8, padding: 14, border: `1px solid ${C.borderSubtle}` }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>Registration Fees</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {training.feeTiers.map((tier, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: index < training.feeTiers.length - 1 ? 6 : 0, borderBottom: index < training.feeTiers.length - 1 ? `1px solid ${C.borderSubtle}` : "none" }}>
                      <span style={{ fontSize: 12, color: C.textSec }}>{tier.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>{tier.amount}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 8 }}>{training.feeSubLabel}</div>
              </div>
            ) : (
              <div style={{ background: C.canvas, borderRadius: 8, padding: 14, border: `1px solid ${C.borderSubtle}` }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Registration Fee</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.primary, letterSpacing: "-0.5px" }}>{training.fee}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{training.feeSubLabel}</div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {training.registrationDetails.map((item, index) => (
                <div key={item.label} style={{ display: "flex", gap: 10, paddingBottom: 10, borderBottom: index < training.registrationDetails.length - 1 ? `1px solid ${C.borderSubtle}` : "none" }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}>{iconForDetail(item.label)}</div>
                  <div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 1, fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link href={registerPath} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 42, borderRadius: 8, background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: shadow.elev2 }}>
              Register for This Training <ArrowRight size={13} />
            </Link>
            <Link href={loginPath} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 36, borderRadius: 7, border: `1px solid ${C.border}`, color: C.textSec, fontSize: 12, fontWeight: 500, textDecoration: "none" }}>
              Login to Continue
            </Link>

            <div style={{ padding: 10, background: C.canvas, borderRadius: 6, border: `1px solid ${C.borderSubtle}` }}>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>Enquiries</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.primary }}>{training.contactEmail}</div>
              <div style={{ fontSize: 11, color: C.textSec, marginTop: 1 }}>{training.contactPhone}</div>
            </div>

            <div style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 6 }}>
              <AlertCircle size={12} style={{ marginTop: 1, flexShrink: 0 }} />
              Registrations are confirmed after payment verification and admin approval inside the training workspace.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
