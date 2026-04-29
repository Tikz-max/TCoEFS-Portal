"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload,
  CreditCard,
  Eye,
  LayoutDashboard,
  HelpCircle,
  LogOut,
  User,
  ChevronRight,
  Mail,
  Phone,
  BookOpen,
  Search,
  Menu,
  X,
} from "lucide-react";
import { signOutAndRedirect } from "@/lib/auth/client-signout";

/* ============================================================================
   DESIGN TOKENS
   ============================================================================ */
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
  elev1: "inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev2: "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12), 0 8px 16px rgba(45,90,45,0.08)",
  elev3: "inset 0 2px 0 rgba(255,255,255,0.85), 0 8px 16px rgba(45,90,45,0.14), 0 16px 32px rgba(45,90,45,0.1)",
  inset: "inset 0 2px 4px rgba(45,90,45,0.15), inset 0 -1px 0 rgba(255,255,255,0.6)",
} as const;

/* ============================================================================
   SIDEBAR WITH HAMBURGER
   ============================================================================ */
function Sidebar({ activeItem = "help", isOpen }: { activeItem?: string; isOpen: boolean }) {
  const router = useRouter();
  const items = [
    { id: "dashboard", label: "Dashboard", href: "/applicant/dashboard", icon: <LayoutDashboard size={16} /> },
    { id: "documents", label: "Documents", href: "/applicant/documents", icon: <Upload size={16} /> },
    { id: "help", label: "Help", href: "/applicant/help", icon: <HelpCircle size={16} /> },
  ];
  return (
    <>
      <div style={{ width: isOpen ? 220 : 0, background: C.dark, display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: shadow.elev1, overflow: "hidden", transition: "width 200ms ease", zIndex: 50, position: "relative" }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.white, letterSpacing: "-0.3px" }}>TCoEFS</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Portal · University of Jos</div>
        </div>
        <div style={{ padding: "12px 18px 8px" }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.pale, background: "rgba(168,212,168,0.12)", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>Postgraduate Applicant</span>
        </div>
        <nav style={{ flex: 1, padding: "8px 10px" }}>
          {items.map((item) => {
            const active = item.id === activeItem;
            return (
              <Link href={item.href} key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 7, marginBottom: 2, background: active ? "rgba(255,255,255,0.12)" : "transparent", color: active ? C.white : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer", borderLeft: active ? `3px solid ${C.pale}` : "3px solid transparent", textDecoration: "none" }}>
                {item.icon}{item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => signOutAndRedirect(router)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 7, color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

function TopBar({ name, onMenuToggle, menuOpen }: { name: string; onMenuToggle: () => void; menuOpen: boolean }) {
  return (
    <div style={{ height: 56, background: C.white, borderBottom: `1px solid ${C.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, boxShadow: shadow.elev1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onMenuToggle} style={{ background: "none", border: "none", padding: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, color: C.textSec }}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Help & Support</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.whisper, border: `2px solid ${C.pale}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary }}>
            <User size={14} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{name}</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   FAQ ITEM
   ============================================================================ */
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.borderSubtle}`, padding: "14px 0" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        {q}
        <ChevronRight size={14} color={C.textMuted} style={{ flexShrink: 0, marginTop: 1 }} />
      </div>
      <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>{a}</div>
    </div>
  );
}

/* ============================================================================
   CONTACT CARD
   ============================================================================ */
function ContactCard({ icon, title, detail, sub, action }: { icon: React.ReactNode; title: string; detail: string; sub: string; action: string }) {
  return (
    <div style={{ background: C.white, borderRadius: 10, boxShadow: shadow.elev2, padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.whisper, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary }}>{icon}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</div>
      </div>
      <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{detail}</div>
      <div style={{ fontSize: 11, color: C.textMuted }}>{sub}</div>
      <button style={{ marginTop: 4, width: "100%", padding: "8px 0", borderRadius: 7, border: `1.5px solid ${C.primary}`, background: "transparent", color: C.primary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        {action}
      </button>
    </div>
  );
}

/* ============================================================================
   MAIN PAGE
   ============================================================================ */

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Applicant");

  useEffect(() => {
    let active = true;

    async function loadName() {
      try {
        const response = await fetch("/api/applicant/dashboard", { method: "GET" });
        const payload = await response.json();
        if (!response.ok || !payload?.success) return;
        if (active && payload?.data?.name) {
          setUserName(payload.data.name);
        }
      } catch {
        // Keep fallback name if request fails
      }
    }

    loadName();
    return () => {
      active = false;
    };
  }, []);

  const faqs = [
    { q: "I was offered admission — what happens next?", a: "Accept your offer on the Dashboard before the deadline. You will then receive enrolment instructions by email, including tuition payment and registration details." },
    { q: "Can I defer my admission to the next session?", a: "Deferral requests must be submitted in writing to the Admissions Office within 14 days of accepting your offer. Deferral is granted at the discretion of the department." },
    { q: "When does the academic session begin?", a: "The 2025/2026 postgraduate session commences in October 2025. Specific orientation dates will be communicated after enrolment is confirmed." },
    { q: "What documents do I need to apply?", a: "You need: Academic Transcript, Degree Certificate, NYSC Certificate or Exemption, two Referees' Letters (combined PDF), and a Passport Photograph (JPEG/PNG, max 500 KB)." },
    { q: "How do I pay the application fee?", a: "After uploading all documents, the portal generates a payment invoice with bank transfer details. Transfer ₦75,000 to the indicated bank account, then upload your payment receipt on the Payment step. Your payment will be verified by the admissions team within 24-48 working hours." },
  ];

  return (
    <div className="applicant-help-shell" style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", fontFamily: "system-ui, sans-serif" }}>
      <TopBar name={userName} onMenuToggle={() => setMenuOpen(!menuOpen)} menuOpen={menuOpen} />
      <div className="applicant-help-body" style={{ display: "flex", flex: 1, minHeight: 0, overflow: "visible" }}>
        <Sidebar isOpen={menuOpen} />
        <div className="applicant-help-main" style={{ flex: 1, overflowY: "visible", background: C.canvas }}>
          <div className="applicant-help-grid" style={{ padding: "20px 24px", display: "flex", gap: 16 }}>
            {/* Main */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.3px", marginBottom: 4 }}>Help & Support</div>
                <div style={{ fontSize: 13, color: C.textSec }}>Find answers to common questions or send an enquiry to our admissions team.</div>
              </div>

              {/* Search bar */}
              <div style={{ position: "relative", marginBottom: 20 }}>
                <Search size={15} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input placeholder="Search help articles…" readOnly style={{ width: "100%", padding: "11px 14px 11px 36px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 13, color: C.text, boxShadow: shadow.inset, boxSizing: "border-box", outline: "none" }} />
              </div>

              {/* Quick links */}
              <div className="applicant-help-quick" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { icon: <BookOpen size={16} />, label: "Application Guide", desc: "Step-by-step walkthrough" },
                  { icon: <CreditCard size={16} />, label: "Payment Help", desc: "Remita & fee queries" },
                ].map(({ icon, label, desc }) => (
                  <div key={label} style={{ background: C.white, borderRadius: 10, boxShadow: shadow.elev2, padding: "14px 16px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ color: C.primary }}>{icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{desc}</div>
                  </div>
                ))}
              </div>

              {/* Enquiry form */}
              <div style={{ background: C.white, borderRadius: 12, boxShadow: shadow.elev2, padding: "18px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>Send an Enquiry</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
                  Your message will be sent to our admissions team. They will reply directly to your registered email address.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 5 }}>Subject</label>
                    <select style={{ width: "100%", padding: "9px 12px", borderRadius: 7, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 13, color: C.text, boxShadow: shadow.inset, outline: "none", boxSizing: "border-box" }}>
                      <option>Offer of Admission</option>
                      <option>Enrolment & Registration</option>
                      <option>Payment & Fees</option>
                      <option>Document Queries</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 5 }}>Message</label>
                    <textarea readOnly placeholder="Describe your query in detail…" style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 13, color: C.text, resize: "none", height: 96, boxShadow: shadow.inset, boxSizing: "border-box", fontFamily: "system-ui, sans-serif", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: `linear-gradient(180deg, ${C.medium} 0%, ${C.primary} 100%)`, color: C.white, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: shadow.elev1 }}>
                      Send Enquiry
                    </button>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div style={{ background: C.white, borderRadius: 12, boxShadow: shadow.elev2, padding: "18px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Frequently Asked Questions</div>
                {faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            </div>

            {/* Right — contact */}
            <div style={{ width: 210, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <ContactCard icon={<Mail size={16} />} title="Email Admissions" detail="admissions@tcoefs-unijos.org" sub="Replies within 2 working days" action="Send Email" />
              <ContactCard icon={<Phone size={16} />} title="Phone Support" detail="+234 803 456 7890" sub="Mon–Fri, 8 AM – 4 PM WAT" action="Call Now" />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 920px) {
          .applicant-help-body,
          .applicant-help-main {
            overflow: visible !important;
          }
          .applicant-help-grid {
            flex-direction: column !important;
            padding: 18px 16px 28px !important;
          }
          .applicant-help-grid > div:last-child {
            width: auto !important;
          }
          .applicant-help-quick {
            grid-template-columns: 1fr !important;
          }
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>
    </div>
  );
}
