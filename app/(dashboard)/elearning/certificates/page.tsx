"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, ExternalLink, ShieldCheck } from "lucide-react";

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
  borderSubtle: "#EBF0EB",
  gold: "#C49A26",
  goldWhisper: "#FDF3D0",
} as const;

type Certificate = {
  id: string;
  courseName: string;
  certificate_number: string;
  issued_at: string;
};

export default function CertificatesPage() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/certificates", { cache: "no-store" });
        const body = await res.json();
        if (!res.ok || !body?.success) {
          throw new Error(body?.error || "Could not load certificates.");
        }
        if (active) setItems((body.data || []) as Certificate[]);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load certificates.");
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

  return (
    <div style={{ minHeight: "100dvh", background: C.canvas, fontFamily: "var(--font-geist-sans, system-ui, sans-serif)", color: C.text }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px 40px", display: "grid", gap: 18 }}>
        <section style={{ borderRadius: 24, background: `radial-gradient(circle at 80% 12%, rgba(196,154,38,0.24), transparent 28%), linear-gradient(140deg, ${C.dark} 0%, ${C.darkest} 58%, #1f3e1f 100%)`, color: C.white, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "end", flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 999, background: "rgba(255,255,255,0.12)", padding: "6px 11px", fontSize: 11, fontWeight: 700, letterSpacing: "0.55px", textTransform: "uppercase" }}>
                <Award size={13} />
                Certificate Vault
              </div>
              <h1 style={{ margin: "16px 0 10px", fontSize: 38, lineHeight: 1.05, letterSpacing: "-0.9px" }}>
                Earned certificates only.
              </h1>
              <p style={{ margin: 0, maxWidth: 760, color: "rgba(255,255,255,0.72)", lineHeight: 1.7, fontSize: 14.5 }}>
                Nothing appears here at signup. Certificates are issued only after verified course completion and passed assessments.
              </p>
            </div>
            <div style={{ borderRadius: 18, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)", padding: "16px 18px", minWidth: 180 }}>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.68)" }}>Certificates Earned</div>
              <div style={{ marginTop: 6, fontSize: 30, fontWeight: 800 }}>{items.length}</div>
            </div>
          </div>
        </section>

        <section style={{ borderRadius: 20, background: C.white, border: `1px solid ${C.borderSubtle}`, padding: 18, boxShadow: "0 12px 28px rgba(45,90,45,0.08)" }}>
          {loading ? <div style={{ color: C.textSec }}>Loading certificates...</div> : null}

          {!loading && error ? <div style={{ color: "#991B1B" }}>{error}</div> : null}

          {!loading && !error && items.length === 0 ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <ShieldCheck size={18} color={C.primary} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>No certificates issued yet</div>
                  <div style={{ marginTop: 6, color: C.textSec, lineHeight: 1.7, fontSize: 13.5 }}>
                    Complete an active course and pass its quizzes before your certificate appears here.
                  </div>
                </div>
              </div>
              <Link href="/elearning/dashboard" style={{ width: "fit-content", display: "inline-flex", alignItems: "center", gap: 7, color: C.primary, textDecoration: "none", fontWeight: 700 }}>
                Return to Learning Dashboard <ExternalLink size={14} />
              </Link>
            </div>
          ) : null}

          {!loading && !error && items.length > 0 ? (
            <div style={{ display: "grid", gap: 14 }}>
              {items.map((item) => (
                <article key={item.id} style={{ borderRadius: 18, border: `1px solid ${C.borderSubtle}`, overflow: "hidden" }}>
                  <div style={{ height: 10, background: `linear-gradient(90deg, ${C.gold}, ${C.primary})` }} />
                  <div style={{ padding: 16, display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>Issued Certificate</div>
                        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800 }}>{item.courseName}</div>
                      </div>
                      <span style={{ borderRadius: 999, background: C.goldWhisper, color: C.gold, padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>
                        Verified
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div style={{ borderRadius: 14, background: C.canvas, padding: 12 }}>
                        <div style={{ fontSize: 11, color: C.textMuted }}>Certificate Number</div>
                        <div style={{ marginTop: 5, fontSize: 13.5, fontWeight: 700 }}>{item.certificate_number}</div>
                      </div>
                      <div style={{ borderRadius: 14, background: C.canvas, padding: 12 }}>
                        <div style={{ fontSize: 11, color: C.textMuted }}>Issued Date</div>
                        <div style={{ marginTop: 5, fontSize: 13.5, fontWeight: 700 }}>{new Date(item.issued_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
