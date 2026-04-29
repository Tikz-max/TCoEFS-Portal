"use client";

import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  BookOpen,
  CreditCard,
  GraduationCap,
  Users,
  Phone,
  Mail,
  Clock,
  Shield,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar/Navbar";

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
  goldLight: "#F0C840",
  goldWhisper: "#FDF3D0",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  textOnGreen: "#FFFFFF",
  border: "#D8E4D8",
  borderStrong: "#B0C8B0",
  borderSubtle: "#EBF0EB",
  errorText: "#991B1B",
  errorBg: "#FEE2E2",
  warningText: "#92400E",
  warningBg: "#FEF3C7",
  infoBg: "#DBEAFE",
  infoText: "#1E40AF",
  successBg: "#DCFCE7",
  successText: "#166534",
} as const;

const shadow = {
  sm: "0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev1:
    "inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev2:
    "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12), 0 8px 16px rgba(45,90,45,0.08)",
} as const;

/* ============================================================================
   FAQ DATA
   ============================================================================ */
const FAQ_SECTIONS = [
  {
    id: "applications",
    label: "Postgraduate Applications",
    icon: GraduationCap,
    count: 8,
    questions: [
      {
        q: "What are the entry requirements for postgraduate programmes?",
        a: "All postgraduate applicants must hold a minimum of a Second Class Lower (2.2) Bachelor's degree from a recognised university in a relevant discipline. Additional requirements vary by programme — specific prerequisites are listed on each programme detail page. NYSC discharge or exemption certificate is required for Nigerian applicants.",
      },
      {
        q: "How many steps are in the application process?",
        a: "The application process consists of seven steps: (1) Select Programme, (2) Complete Application Form, (3) Upload Academic Credentials, (4) Generate Payment Invoice, (5) Make Bank Transfer, (6) Upload Payment Receipt, and (7) Await Admin Review. You can save your progress and return at any point before final submission.",
      },
      {
        q: "What documents do I need to upload?",
        a: "Required documents include: Bachelor's degree certificate and transcripts, NYSC discharge/exemption certificate, birth certificate or valid national ID, two referee letters from academic supervisors, a statement of purpose (500–800 words), and passport photograph (white background, JPEG, max 500KB). Accepted file formats are PDF and JPEG. Maximum size per file is 5MB.",
      },
      {
        q: "Can I apply to more than one programme simultaneously?",
        a: "Yes. You may submit applications to multiple programmes under one account. Each application is treated independently and requires its own payment. Your dashboard will show the status of all active applications.",
      },
      {
        q: "What happens after I submit my application?",
        a: "After submission, your application enters the Admin Review queue. You will receive an email confirmation. The admissions office typically reviews applications within 10–15 working days. You can monitor your application status in real time from your dashboard. You will be notified by email when a decision is made.",
      },
      {
        q: "How do I track my application status?",
        a: "Log in to your portal account and navigate to My Applications from your dashboard. Each application card displays the current status — Pending, Under Review, Approved, or Rejected — along with the date of last update and any reviewer notes.",
      },
      {
        q: "Can I edit my application after submission?",
        a: "Applications cannot be edited after final submission. If you identify a critical error, contact the Admissions Office via the Contact page within 48 hours of submission. Include your Application Reference ID in all correspondence.",
      },
      {
        q: "What is the application fee and is it refundable?",
        a: "The application processing fee is ₦15,000. This fee is non-refundable regardless of the outcome of your application. The fee covers administrative processing and is separate from the programme tuition fee.",
      },
    ],
  },
  {
    id: "payments",
    label: "Payments & Bank Transfer",
    icon: CreditCard,
    count: 6,
    questions: [
      {
        q: "How do I make payment for my application?",
        a: "After generating a payment invoice on the portal, you will receive bank transfer details (bank name, account number, and account name). Transfer the exact amount to the indicated account, then return to the portal to upload a photo or scan of your payment receipt as proof of payment. Your payment will be verified by the admissions team within 24-48 working hours.",
      },
      {
        q: "Which bank should I transfer to?",
        a: "The portal provides bank transfer details on the payment invoice step. All payments are processed through Access Bank PLC. The account number and account name are displayed specifically for your application. Do not transfer to any other account unless explicitly instructed.",
      },
      {
        q: "How long does payment verification take?",
        a: "Payment verification typically takes 24-48 working hours after you upload your proof of payment. The admissions team manually verifies each payment against bank records before confirming your application. You will receive an email notification once your payment is approved.",
      },
      {
        q: "My payment was successful but the portal still shows 'Pending Verification.' What should I do?",
        a: "First, confirm that you have uploaded your payment receipt on Step 5 of the application process. If you have uploaded it and 48 working hours have passed without a status update, contact the Admissions Office via the Contact page. Include your Application Reference ID and the date of your bank transfer.",
      },
      {
        q: "Can I reuse a bank transfer for a different application?",
        a: "No. Each payment is linked to a specific application and amount. Using a transfer meant for one application to pay for another will result in payment rejection. Always generate a new payment invoice for each application.",
      },
      {
        q: "What file formats are accepted for payment proof upload?",
        a: "Accepted formats are PDF, JPEG, and PNG. Maximum file size is 5MB. The document must clearly show the transaction date, amount paid, bank name, and your name as the payer. Photos of bank receipts or SMS alerts are acceptable as long as they contain all required fields.",
      },
    ],
  },
  {
    id: "training",
    label: "Training Registration",
    icon: Users,
    count: 5,
    questions: [
      {
        q: "Who can register for TCoEFS training programmes?",
        a: "TCoEFS training programmes are open to farmers, agribusiness operators, agricultural extension workers, rural development professionals, and anyone seeking practical knowledge in food security, agricultural value chains, and related disciplines. Some specialised clinics require prior experience — requirements are listed on each training detail page.",
      },
      {
        q: "Are training programmes available online or in-person?",
        a: "Both modalities are available. Physical training takes place at the TCoEFS facility at the University of Jos, Plateau State. Remote participants may access select programmes via livestream and receive materials digitally. The mode of delivery (Physical / Online / Hybrid) is clearly displayed on each training listing.",
      },
      {
        q: "How do I get a certificate for a training programme?",
        a: "Participants who complete at least 80% of a training programme and pass any end-of-course assessment receive a TCoEFS Certificate of Participation. Certificates are digitally issued and available for download from your dashboard. Physical certificate copies can be requested at an additional administrative fee.",
      },
      {
        q: "Can I register for multiple training sessions at once?",
        a: "Yes. You may register for any number of open sessions from your account. Each registration is processed independently with its own payment reference. Your Training Participant dashboard consolidates all registrations in one view.",
      },
      {
        q: "What happens if I miss a session after registering?",
        a: "Attendance records are maintained per session. If you miss more than 20% of a programme due to documented extenuating circumstances, contact the Training Coordinator within 48 hours. Deferral to a future cohort may be considered but is not guaranteed. Fees are non-refundable.",
      },
    ],
  },
  {
    id: "elearning",
    label: "E-Learning",
    icon: BookOpen,
    count: 6,
    questions: [
      {
        q: "How do I enrol in an e-learning course?",
        a: "From the E-Learning page, browse available courses and click on any course to view its detail page. Click 'Enrol Now' and follow the registration steps. Some courses are free; paid courses require payment via Remita before access is granted. After enrolment, courses appear in your E-Learning dashboard.",
      },
      {
        q: "Can I access course materials offline?",
        a: "Course videos and documents are streamed online and cannot be downloaded for offline use. Ensure you have a stable internet connection before beginning a module. Course PDFs and reading materials marked as 'Downloadable' can be saved locally from within the module player.",
      },
      {
        q: "What is the passing score for quizzes?",
        a: "The minimum passing score for all quizzes is 60%. You may reattempt a quiz up to three times. After three failed attempts, the module is locked and you must contact the E-Learning Manager to request an unlock. Your highest score across attempts is recorded.",
      },
      {
        q: "How are e-learning certificates generated?",
        a: "Upon completing all modules in a course and achieving a passing score on the final assessment, a certificate is automatically generated and becomes available in your dashboard. Certificates include your full name, course title, completion date, and a unique verification code. They can be downloaded as a PDF or shared via a public link.",
      },
      {
        q: "My course progress is not saving. What should I do?",
        a: "Course progress is saved automatically after each module completion. If progress appears lost, first try refreshing the page. If the issue persists, clear your browser cache and log in again. If progress is still not reflected after 30 minutes, contact the E-Learning support team with your Account ID and the affected course name.",
      },
      {
        q: "Is there a time limit to complete a course after enrolment?",
        a: "Most self-paced courses remain accessible for 12 months from the date of enrolment. Courses tied to a cohort or intake date may have a specific completion deadline, which is displayed on the course detail page. You will receive reminder emails at 30 days and 7 days before expiry.",
      },
    ],
  },
  {
    id: "account",
    label: "Account & Access",
    icon: Shield,
    count: 4,
    questions: [
      {
        q: "How do I create a portal account?",
        a: "Click 'Apply Now' or 'Register' in the navigation bar to begin account creation. You will need a valid email address and phone number. After submitting the registration form, check your email for a verification link. Your account must be verified before you can submit applications or register for training.",
      },
      {
        q: "I did not receive my verification email. What should I do?",
        a: "Check your spam/junk folder first. If the email is not there, wait 10 minutes and then use the 'Resend Verification Email' option on the login page. Ensure the email address you entered during registration is correct. If the issue persists, contact support with your registered email address.",
      },
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot Password' on the login page and enter your registered email address. A password reset link will be sent to you and is valid for 30 minutes. For security reasons, the link can only be used once. If the link expires before you use it, request a new one.",
      },
      {
        q: "Can I change my registered email address?",
        a: "Email address changes are not permitted through the portal self-service. This is to protect the integrity of application and payment records linked to your account. If you need to update your email address due to loss of access, contact the portal administrator with a valid government-issued ID for identity verification.",
      },
    ],
  },
];

/* ============================================================================
   HELP PAGE — VARIANT B (STRUCTURED & DENSE)
   ============================================================================ */
export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState(FAQ_SECTIONS[0].id);

  const toggle = (key: string) =>
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const currentSection = FAQ_SECTIONS.find((s) => s.id === activeSection)!;

  const filteredQuestions =
    query === ""
      ? currentSection.questions
      : currentSection.questions.filter(
          (item) =>
            item.q.toLowerCase().includes(query.toLowerCase()) ||
            item.a.toLowerCase().includes(query.toLowerCase()),
        );

  const allMatchCount = query
    ? FAQ_SECTIONS.reduce(
        (acc, sec) =>
          acc +
          sec.questions.filter(
            (item) =>
              item.q.toLowerCase().includes(query.toLowerCase()) ||
              item.a.toLowerCase().includes(query.toLowerCase()),
          ).length,
        0,
      )
    : null;

  const sectionMatchCount = (secId: string) => {
    if (!query) return FAQ_SECTIONS.find((s) => s.id === secId)?.count ?? 0;
    const sec = FAQ_SECTIONS.find((s) => s.id === secId);
    if (!sec) return 0;
    return sec.questions.filter(
      (item) =>
        item.q.toLowerCase().includes(query.toLowerCase()) ||
        item.a.toLowerCase().includes(query.toLowerCase()),
    ).length;
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: C.canvas,
        fontFamily:
          "var(--font-sans, 'GeistSans', Inter, system-ui, sans-serif)",
        overflow: "visible",
      }}
    >
      <Navbar activePage="help" />

      <style>{`
        @media (max-width: 920px) {
          .help-header {
            align-items: stretch !important;
            flex-direction: column !important;
            padding: 28px 22px !important;
            gap: 16px !important;
          }
          .help-search {
            width: 100% !important;
          }
          .help-layout {
            flex-direction: column !important;
            overflow: visible !important;
          }
          .help-sidebar {
            width: auto !important;
            border-right: 0 !important;
            border-bottom: 1px solid ${C.borderSubtle} !important;
            max-height: none !important;
          }
          .help-main {
            overflow: visible !important;
          }
          .help-section-header {
            position: static !important;
            padding: 20px 22px 18px !important;
          }
          .help-question-button {
            padding: 18px 22px !important;
          }
          .help-answer {
            padding-left: 22px !important;
            padding-right: 22px !important;
          }
        }
      `}</style>

      {/* Sub-header */}
      <div
        className="help-header"
        style={{
          background: C.dark,
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.9px",
              textTransform: "uppercase" as const,
              marginBottom: 4,
            }}
          >
            Help Centre
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: C.white,
              margin: 0,
              letterSpacing: "-0.4px",
            }}
          >
            Frequently Asked Questions
          </h1>
        </div>

        {/* Search */}
        <div className="help-search" style={{ position: "relative", width: 360, flexShrink: 0 }}>
          <Search
            size={15}
            color="rgba(255,255,255,0.35)"
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search all FAQs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              height: 40,
              paddingLeft: 40,
              paddingRight: 14,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.07)",
              color: C.white,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box" as const,
              fontFamily: "inherit",
              transition: "border-color 0.15s ease",
            }}
          />
        </div>

        {allMatchCount !== null && (
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              flexShrink: 0,
              minWidth: 80,
            }}
          >
            {allMatchCount} match{allMatchCount !== 1 ? "es" : ""} across all
          </div>
        )}
      </div>

      {/* Two-panel layout */}
      <div className="help-layout" style={{ flex: 1, display: "flex", overflow: "visible" }}>
        {/* ── SIDEBAR ── */}
        <div
          className="help-sidebar"
          style={{
            width: 260,
            flexShrink: 0,
            background: C.white,
            borderRight: `1px solid ${C.borderSubtle}`,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Category label */}
          <div
            style={{
              padding: "20px 20px 10px",
              fontSize: 10,
              fontWeight: 700,
              color: C.textMuted,
              letterSpacing: "0.8px",
              textTransform: "uppercase" as const,
            }}
          >
            Categories
          </div>

          {FAQ_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = sec.id === activeSection;
            const matchCount = sectionMatchCount(sec.id);
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                style={{
                  width: "100%",
                  padding: "10px 20px",
                  background: isActive ? C.whisper : "transparent",
                  border: "none",
                  borderRight: isActive
                    ? `3px solid ${C.primary}`
                    : "3px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  textAlign: "left" as const,
                  transition: "all 0.14s ease",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: isActive ? C.primary : C.canvas,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.14s ease",
                  }}
                >
                  <Icon size={13} color={isActive ? C.white : C.textSec} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? C.primary : C.text,
                      lineHeight: 1.3,
                    }}
                  >
                    {sec.label}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isActive ? C.primary : C.textMuted,
                    background: isActive ? C.pale : C.canvas,
                    borderRadius: 10,
                    padding: "1px 7px",
                    flexShrink: 0,
                    transition: "all 0.14s ease",
                    opacity: query && matchCount === 0 ? 0.4 : 1,
                  }}
                >
                  {matchCount}
                </div>
              </button>
            );
          })}

          {/* Divider */}
          <div
            style={{
              margin: "16px 20px",
              borderTop: `1px solid ${C.borderSubtle}`,
            }}
          />

          {/* Quick contact info */}
          <div
            style={{
              padding: "0 20px 10px",
              fontSize: 10,
              fontWeight: 700,
              color: C.textMuted,
              letterSpacing: "0.8px",
              textTransform: "uppercase" as const,
            }}
          >
            Quick Links
          </div>
          {[
            { icon: Clock, label: "Office Hours", sub: "Mon–Fri, 8am–5pm WAT" },
            {
              icon: Mail,
              label: "Email Support",
              sub: "support@tcoefs.unijos.edu.ng",
            },
            { icon: Phone, label: "Telephone", sub: "+234 (0) 803 000 0000" },
          ].map((ql) => {
            const Icon = ql.icon;
            return (
              <div
                key={ql.label}
                style={{
                  padding: "8px 20px",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <Icon
                  size={13}
                  color={C.textMuted}
                  style={{ marginTop: 1, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                    {ql.label}
                  </div>
                  <div
                    style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}
                  >
                    {ql.sub}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Contact support CTA */}
          <div style={{ padding: "16px 20px 24px" }}>
            <a
              href="/contact"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                width: "100%",
                height: 38,
                borderRadius: 8,
                background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`,
                color: C.white,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: shadow.sm,
                cursor: "pointer",
                fontFamily: "inherit",
                border: "none",
              }}
            >
              <MessageCircle size={13} />
              Contact Support
            </a>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="help-main" style={{ flex: 1, overflowY: "auto" }}>
          {/* Section header — sticky */}
          <div
            className="help-section-header"
            style={{
              padding: "20px 36px 18px",
              borderBottom: `1px solid ${C.borderSubtle}`,
              background: C.white,
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "sticky",
              top: 0,
              zIndex: 5,
              boxShadow: "0 1px 0 rgba(45,90,45,0.06)",
            }}
          >
            {(() => {
              const Icon = currentSection.icon;
              return (
                <>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: C.whisper,
                      border: `1px solid ${C.pale}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} color={C.primary} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: C.text,
                        margin: 0,
                        letterSpacing: "-0.2px",
                      }}
                    >
                      {currentSection.label}
                    </h2>
                    <div
                      style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}
                    >
                      {filteredQuestions.length} question
                      {filteredQuestions.length !== 1 ? "s" : ""}
                      {query && filteredQuestions.length > 0
                        ? ` matching "${query}"`
                        : ""}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: C.canvas,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: "4px 10px",
                    }}
                  >
                    <HelpCircle size={11} color={C.textMuted} />
                    <span
                      style={{
                        fontSize: 11,
                        color: C.textMuted,
                        fontWeight: 500,
                      }}
                    >
                      Help Centre
                    </span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Questions */}
          <div style={{ padding: "4px 0 48px" }}>
            {filteredQuestions.length === 0 ? (
              <div
                style={{
                  padding: "64px 36px",
                  textAlign: "center" as const,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: C.canvas,
                    border: `1px solid ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                  }}
                >
                  <Search size={20} color={C.textMuted} />
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: C.textSec,
                    marginBottom: 4,
                  }}
                >
                  No results in {currentSection.label}
                </div>
                <div style={{ fontSize: 13, color: C.textMuted }}>
                  Try a different search term or browse another category
                </div>
              </div>
            ) : (
              filteredQuestions.map((item, i) => {
                const key = `${activeSection}-${i}`;
                const isOpen = openItems[key];
                return (
                  <div
                    key={key}
                    style={{
                      borderBottom: `1px solid ${C.borderSubtle}`,
                    }}
                  >
                    <button
                      className="help-question-button"
                      onClick={() => toggle(key)}
                      style={{
                        width: "100%",
                        padding: "18px 36px",
                        background: isOpen ? C.whisper : "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 16,
                        cursor: "pointer",
                        textAlign: "left" as const,
                        transition: "background 0.14s ease",
                        fontFamily: "inherit",
                      }}
                    >
                      <div
                        className="help-answer"
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          flex: 1,
                        }}
                      >
                        {/* Number badge */}
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: isOpen ? C.primary : C.canvas,
                            border: `1px solid ${isOpen ? C.primary : C.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontSize: 10,
                            fontWeight: 700,
                            color: isOpen ? C.white : C.textMuted,
                            marginTop: 2,
                            transition: "all 0.14s ease",
                            fontFamily:
                              "var(--font-mono, 'GeistMono', monospace)",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: isOpen ? 600 : 500,
                            color: isOpen ? C.primary : C.text,
                            lineHeight: 1.5,
                            transition: "color 0.14s ease",
                          }}
                        >
                          {item.q}
                        </span>
                      </div>
                      <span style={{ flexShrink: 0, marginTop: 2 }}>
                        {isOpen ? (
                          <ChevronUp size={15} color={C.primary} />
                        ) : (
                          <ChevronDown size={15} color={C.textMuted} />
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <div
                        style={{
                          padding: "0 36px 20px",
                          paddingLeft: 70,
                        }}
                      >
                        <div
                          style={{
                            background: C.white,
                            border: `1px solid ${C.border}`,
                            borderRadius: 10,
                            padding: "16px 20px",
                            fontSize: 14,
                            color: C.textSec,
                            lineHeight: 1.72,
                            boxShadow: shadow.elev1,
                          }}
                        >
                          {item.a}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
