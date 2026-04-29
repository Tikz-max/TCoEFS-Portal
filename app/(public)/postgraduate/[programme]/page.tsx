import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, CheckCircle2, Clock3, FileText, MapPin, Shield } from "lucide-react";
import { Navbar } from "@/components/layout/navbar/Navbar";
import { getPublicPostgraduateProgrammeBySlug } from "@/features/postgraduate/catalogue";

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

export default async function PostgraduateDetailPage({
  params,
}: {
  params: Promise<{ programme: string }>;
}) {
  const resolved = await params;
  const prog = await getPublicPostgraduateProgrammeBySlug(resolved.programme);
  if (!prog) notFound();

  const beginPath = `/applicant/application/1?begin=1&programme=${encodeURIComponent(prog.slug)}`;
  const loginPath = `/login?redirect=${encodeURIComponent(beginPath)}`;
  const closingSoon = prog.status === "Closing Soon";

  return (
    <div style={{ minHeight: "100dvh", background: C.canvas, fontFamily: "var(--font-sans)" }}>
      <Navbar activePage="applications" />

      <style>{`
        .pgd-shell {
          width: min(1220px, calc(100% - 48px));
          margin: 0 auto;
          padding-bottom: 36px;
        }
        .pgd-main {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
          margin-top: 14px;
        }
        .pgd-card {
          border: 1px solid ${C.borderSubtle};
          border-radius: 14px;
          background: ${C.white};
          padding: 16px;
        }
        @media (max-width: 980px) {
          .pgd-shell { width: calc(100% - 28px); }
          .pgd-main { grid-template-columns: 1fr; }
        }
      `}</style>

      <main className="pgd-shell">
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Link href="/postgraduate" style={{ fontSize: 13, color: C.primary, textDecoration: "none", fontWeight: 700 }}>
            {"<- All postgraduate programmes"}
          </Link>
          <div style={{ fontSize: 12, color: C.textMuted }}>
            Home / Postgraduate / {prog.title}
          </div>
        </div>

        <section style={{ marginTop: 10, borderRadius: 18, border: `1px solid ${C.borderSubtle}`, background: C.white, overflow: "hidden" }}>
          <div style={{ background: `linear-gradient(140deg, ${C.dark} 0%, ${C.darkest} 60%, #1f3e1f 100%)`, color: "rgba(255,255,255,0.92)", padding: "24px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, letterSpacing: "0.6px", textTransform: "uppercase", opacity: 0.7 }}>{prog.code}</span>
              {prog.qualifications && prog.qualifications.length > 0 && (
                <span style={{ fontSize: 10, background: "rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: 999 }}>{prog.qualifications.join(" | ")}</span>
              )}
              <span style={{ fontSize: 11, fontWeight: 700, color: closingSoon ? C.warningText : C.successText, background: closingSoon ? C.warningBg : C.successBg, padding: "3px 8px", borderRadius: 999 }}>{prog.status}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 34, letterSpacing: "-0.8px", lineHeight: 1.08 }}>{prog.title}</h1>
            {prog.institution && (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>{prog.institution}</div>
            )}
            {prog.awardingBody && (
              <div style={{ marginTop: 2, fontSize: 12, opacity: 0.6 }}>Awarding: {prog.awardingBody}</div>
            )}
            <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5, color: "rgba(255,255,255,0.74)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Calendar size={13} />Deadline: {prog.deadline}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Clock3 size={13} />{prog.pgdDuration || prog.duration}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><MapPin size={13} />{prog.mode}</span>
            </div>
          </div>
        </section>

        <div className="pgd-main">
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <article className="pgd-card">
              <h2 style={{ margin: 0, fontSize: 16, color: C.text }}>Overview</h2>
              <p style={{ margin: "8px 0 0", fontSize: 13.5, color: C.textSec, lineHeight: 1.75 }}>{prog.overview}</p>
            </article>

            <article className="pgd-card">
              <h2 style={{ margin: 0, fontSize: 16, color: C.text }}>Programme Objectives</h2>
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {prog.programmeObjectives.map((item) => (
                  <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: C.textSec }}>
                    <CheckCircle2 size={14} color={C.primary} style={{ marginTop: 1, flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </article>

            {prog.coreModules && prog.coreModules.length > 0 && (
              <article className="pgd-card">
                <h2 style={{ margin: 0, fontSize: 16, color: C.text }}>Core Modules</h2>
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {prog.coreModules.map((item) => (
                    <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: C.textSec }}>
                      <FileText size={14} color={C.textMuted} style={{ marginTop: 1, flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            )}

            <article className="pgd-card">
              <h2 style={{ margin: 0, fontSize: 16, color: C.text }}>Eligibility</h2>
              <p style={{ margin: "8px 0 0", fontSize: 13.5, color: C.textSec, lineHeight: 1.75 }}>{prog.eligibility}</p>
              {prog.pgdAdmissionRequirements && (
                <div style={{ marginTop: 10, padding: "10px 12px", background: C.whisper, borderRadius: 8, fontSize: 12.5 }}>
                  <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>For Postgraduate Diploma:</div>
                  <div style={{ color: C.textSec }}>{prog.pgdAdmissionRequirements}</div>
                </div>
              )}
              {prog.mscAdmissionRequirements && (
                <div style={{ marginTop: 8, padding: "10px 12px", background: C.whisper, borderRadius: 8, fontSize: 12.5 }}>
                  <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>For MSc/MBA/M.Agric:</div>
                  <div style={{ color: C.textSec }}>{prog.mscAdmissionRequirements}</div>
                </div>
              )}
              {prog.registrationInfo && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: C.textMuted, fontStyle: "italic" }}>
                  {prog.registrationInfo}
                </div>
              )}
            </article>

            {prog.careerOutcomes && prog.careerOutcomes.length > 0 && (
              <article className="pgd-card">
                <h2 style={{ margin: 0, fontSize: 16, color: C.text }}>Career Outcomes</h2>
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {prog.careerOutcomes.map((item) => (
                    <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: C.textSec }}>
                      <CheckCircle2 size={14} color={C.primary} style={{ marginTop: 1, flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            )}

            <article className="pgd-card">
              <h2 style={{ margin: 0, fontSize: 16, color: C.text }}>Required Documents</h2>
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {prog.documents.map((doc) => (
                  <div key={doc} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: C.textSec }}>
                    <FileText size={14} color={C.textMuted} style={{ marginTop: 1, flexShrink: 0 }} />
                    {doc}
                  </div>
                ))}
              </div>
            </article>
          </section>

          <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <section className="pgd-card">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted, marginBottom: 8 }}>
                Application Checklist
              </div>
              <div style={{ display: "grid", gap: 7, fontSize: 12.5, color: C.textSec }}>
                {[
                  "Create portal account",
                  "Select programme",
                  "Complete application form",
                  "Upload required documents",
                  "Generate and pay RRR",
                  "Submit before deadline",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <CheckCircle2 size={13} color={C.primary} style={{ marginTop: 1, flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="pgd-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 14px 0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>Key Dates & Fees</div>
              </div>
              <div style={{ marginTop: 10, borderTop: `1px solid ${C.borderSubtle}` }}>
                {[
                  { label: "Deadline", value: prog.deadline },
                  { label: "Start Date", value: prog.startDate },
                  { label: "Application Fee", value: prog.fee },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "11px 14px", borderBottom: `1px solid ${C.borderSubtle}`, fontSize: 12.5 }}>
                    <span style={{ color: C.textMuted }}>{row.label}</span>
                    <span style={{ color: C.text, fontWeight: 700 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <Link href={beginPath} style={{ height: 46, borderRadius: 10, background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`, color: C.white, textDecoration: "none", fontSize: 13.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              Begin Application
              <ArrowRight size={14} />
            </Link>
            <Link href={loginPath} style={{ height: 44, borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.text, textDecoration: "none", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              I already have an account
            </Link>

            <div style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 6 }}>
              <Shield size={12} style={{ marginTop: 1, flexShrink: 0 }} />
              Applications are reviewed after full document and payment verification.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
