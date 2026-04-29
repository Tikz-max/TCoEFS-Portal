"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Building2,
  Users,
  GraduationCap,
  Loader2,
  ExternalLink,
  ChevronDown,
  Globe,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar/Navbar";
import contactImage from "../../../portal_images/founder_holding_club.jpg";

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
   DATA
   ============================================================================ */
const CONTACT_DETAILS = [
  {
    icon: Mail,
    label: "Email",
    primary: "info@tcoefs.unijos.edu.ng",
    secondary: "General enquiries & programme information",
    href: "mailto:info@tcoefs.unijos.edu.ng",
  },
  {
    icon: Phone,
    label: "Telephone",
    primary: "+234 (0) 803 000 0000",
    secondary: "Mon – Fri, 8:00 am – 5:00 pm WAT",
    href: "tel:+2348030000000",
  },
  {
    icon: MapPin,
    label: "Address",
    primary: "TCoEFS Building, Faculty of Agriculture",
    secondary: "University of Jos, Plateau State, Nigeria",
    href: "https://maps.google.com",
  },
  {
    icon: Clock,
    label: "Office Hours",
    primary: "Monday – Friday, 8:00 am – 5:00 pm",
    secondary: "Closed on Nigerian public holidays",
    href: null,
  },
];

const DEPARTMENTS = [
  {
    id: "admissions",
    label: "Admissions Office",
    email: "admissions@tcoefs.unijos.edu.ng",
    desc: "Postgraduate programme applications, admission decisions, document verification",
    icon: GraduationCap,
  },
  {
    id: "training",
    label: "Training Coordinator",
    email: "training@tcoefs.unijos.edu.ng",
    desc: "Short course registration, attendance, certificates, scheduling",
    icon: Users,
  },
  {
    id: "elearning",
    label: "E-Learning Support",
    email: "elearning@tcoefs.unijos.edu.ng",
    desc: "Course access issues, quiz concerns, module progress, online certificates",
    icon: Globe,
  },
  {
    id: "payments",
    label: "Payment Verification",
    email: "payments@tcoefs.unijos.edu.ng",
    desc: "Remita RRR issues, payment proof status, verification delays",
    icon: Building2,
  },
  {
    id: "portal",
    label: "Portal Support",
    email: "support@tcoefs.unijos.edu.ng",
    desc: "Account access, login issues, technical errors, password resets",
    icon: MessageCircle,
  },
];

const SUBJECTS = [
  "Postgraduate Application Enquiry",
  "Training Registration Question",
  "E-Learning Course Support",
  "Payment / Remita Issue",
  "Document Upload Problem",
  "Account Access Issue",
  "Certificate Request",
  "Programme Information",
  "Other",
];

/* ============================================================================
   FORM HOOK
   ============================================================================ */
function useContactForm() {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    department: "",
    message: "",
    refId: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const update = (field: string, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const blur = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fields.name.trim()) errs.name = "Full name is required";
    if (!fields.email.trim()) errs.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      errs.email = "Enter a valid email address";
    if (!fields.subject) errs.subject = "Please select a subject";
    if (!fields.message.trim()) errs.message = "Message is required";
    else if (fields.message.trim().length < 20)
      errs.message = "Please provide at least 20 characters";
    return errs;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTouched({ name: true, email: true, subject: true, message: true });
      return;
    }
    setStatus("sending");
    setStatus("sent");
  };

  return { fields, update, blur, touched, errors, status, submit };
}

/* ============================================================================
   SHARED FORM COMPONENTS
   ============================================================================ */
function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.textSec,
          letterSpacing: "0.5px",
          textTransform: "uppercase" as const,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {label}
        {required && (
          <span style={{ color: C.errorText, fontWeight: 800 }}>*</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <span style={{ fontSize: 11, color: C.textMuted }}>{hint}</span>
      )}
      {error && (
        <span
          style={{
            fontSize: 11,
            color: C.errorText,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <AlertCircle size={11} />
          {error}
        </span>
      )}
    </div>
  );
}

function StyledInput({
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  hasError,
  mono,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  mono?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      style={{
        height: 42,
        padding: "0 14px",
        borderRadius: 9,
        border: `1.5px solid ${hasError ? C.errorText : focused ? C.primary : C.border}`,
        background: C.white,
        fontSize: 14,
        color: C.text,
        outline: "none",
        width: "100%",
        boxSizing: "border-box" as const,
        fontFamily: mono
          ? "var(--font-mono, 'GeistMono', monospace)"
          : "inherit",
        transition: "border-color 0.15s ease",
        letterSpacing: mono ? "0.4px" : "inherit",
      }}
    />
  );
}

function StyledSelect({
  value,
  onChange,
  options,
  placeholder,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  hasError?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 42,
          padding: "0 36px 0 14px",
          borderRadius: 9,
          border: `1.5px solid ${hasError ? C.errorText : focused ? C.primary : C.border}`,
          background: C.white,
          fontSize: 14,
          color: value ? C.text : C.textMuted,
          outline: "none",
          width: "100%",
          appearance: "none" as const,
          WebkitAppearance: "none" as const,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "border-color 0.15s ease",
          boxSizing: "border-box" as const,
        }}
      >
        {options.map((opt, i) =>
          i === 0 ? (
            <option key="placeholder" value="" disabled hidden>
              {placeholder}
            </option>
          ) : (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ),
        )}
      </select>
      <ChevronDown
        size={14}
        color={C.textMuted}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function StyledTextarea({
  placeholder,
  value,
  onChange,
  onBlur,
  hasError,
  rows = 5,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      style={{
        padding: "12px 14px",
        borderRadius: 9,
        border: `1.5px solid ${hasError ? C.errorText : focused ? C.primary : C.border}`,
        background: C.white,
        fontSize: 14,
        color: C.text,
        outline: "none",
        width: "100%",
        boxSizing: "border-box" as const,
        fontFamily: "inherit",
        resize: "vertical" as const,
        lineHeight: 1.6,
        transition: "border-color 0.15s ease",
        minHeight: 100,
      }}
    />
  );
}

/* ============================================================================
   CONTACT PAGE — VARIANT A (SPLIT PANEL)
   ============================================================================ */
export default function ContactPage() {
  const { fields, update, blur, touched, errors, status, submit } =
    useContactForm();
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

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
      <Navbar activePage="contact" />

      <style>{`
        .contact-photo {
          min-height: 150px;
          border-radius: 24px;
          background-size: cover;
          background-position: center;
          border: 1px solid ${C.borderSubtle};
          box-shadow: 0 18px 44px rgba(45,90,45,0.14);
          margin: 0 0 28px;
          position: relative;
          overflow: hidden;
        }
        .contact-photo::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15,34,16,0.04), rgba(15,34,16,0.42));
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 920px) {
          .contact-layout {
            flex-direction: column !important;
            overflow: visible !important;
          }
          .contact-side {
            width: auto !important;
            border-right: 0 !important;
            border-bottom: 1px solid ${C.borderSubtle} !important;
            padding: 36px 22px !important;
          }
          .contact-side h1 {
            font-size: 34px !important;
          }
          .contact-photo {
            min-height: 220px;
          }
          .contact-form-panel {
            padding: 34px 20px 48px !important;
            overflow: visible !important;
          }
          .contact-form-grid {
            grid-template-columns: 1fr !important;
          }
          .contact-submit-row {
            align-items: flex-start !important;
            flex-direction: column !important;
          }
        }
      `}</style>

      <div className="contact-layout" style={{ flex: 1, display: "flex", overflow: "visible" }}>
        {/* ── LEFT PANEL ── */}
        <div
          className="contact-side"
          style={{
            width: 400,
            flexShrink: 0,
            background: C.white,
            borderRight: `1px solid ${C.borderSubtle}`,
            overflowY: "auto",
            padding: "48px 40px 48px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: C.whisper,
              border: `1px solid ${C.pale}`,
              borderRadius: 20,
              padding: "5px 12px",
              marginBottom: 20,
              alignSelf: "flex-start",
            }}
          >
            <MessageCircle size={11} color={C.primary} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.primary,
                letterSpacing: "0.8px",
                textTransform: "uppercase" as const,
              }}
            >
              Get in Touch
            </span>
          </div>

          <h1
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: C.text,
              letterSpacing: "-0.6px",
              lineHeight: 1.15,
              margin: "0 0 12px",
            }}
          >
            We&rsquo;re here to
            <br />
            <span style={{ color: C.primary }}>help you succeed.</span>
          </h1>
          <p
            style={{
              fontSize: 14,
              color: C.textSec,
              lineHeight: 1.65,
              margin: "0 0 32px",
            }}
          >
            The TCoEFS portal support team handles enquiries Monday through
            Friday. Include your Application Reference ID or RRR in all
            payment-related messages.
          </p>

          <div
            className="contact-photo"
            style={{ backgroundImage: `url(${contactImage.src})` }}
            aria-hidden="true"
          />

          {/* Contact details */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {CONTACT_DETAILS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 0",
                    borderBottom: `1px solid ${C.borderSubtle}`,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: C.whisper,
                      border: `1px solid ${C.pale}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color={C.primary} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.textMuted,
                        letterSpacing: "0.6px",
                        textTransform: "uppercase" as const,
                        marginBottom: 3,
                      }}
                    >
                      {item.label}
                    </div>
                    {item.href ? (
                      <a
                        href={item.href}
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: C.text,
                          textDecoration: "none",
                          display: "block",
                          marginBottom: 2,
                        }}
                      >
                        {item.primary}
                      </a>
                    ) : (
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: C.text,
                          marginBottom: 2,
                        }}
                      >
                        {item.primary}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: C.textMuted }}>
                      {item.secondary}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Department directory */}
          <div style={{ marginTop: 28, flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.textMuted,
                letterSpacing: "0.8px",
                textTransform: "uppercase" as const,
                marginBottom: 10,
              }}
            >
              Direct Department Contacts
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {DEPARTMENTS.map((dept) => {
                const Icon = dept.icon;
                const isOpen = expandedDept === dept.id;
                return (
                  <div
                    key={dept.id}
                    style={{
                      background: isOpen ? C.whisper : C.canvas,
                      border: `1px solid ${isOpen ? C.pale : C.borderSubtle}`,
                      borderRadius: 10,
                      overflow: "hidden",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <button
                      onClick={() => setExpandedDept(isOpen ? null : dept.id)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "transparent",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        cursor: "pointer",
                        textAlign: "left" as const,
                        fontFamily: "inherit",
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          background: isOpen ? C.primary : C.white,
                          border: `1px solid ${isOpen ? C.primary : C.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                          boxShadow: isOpen ? "none" : shadow.sm,
                        }}
                      >
                        <Icon size={12} color={isOpen ? C.white : C.textSec} />
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: isOpen ? 700 : 500,
                          color: isOpen ? C.primary : C.text,
                          flex: 1,
                          transition: "color 0.15s ease",
                        }}
                      >
                        {dept.label}
                      </span>
                      <ChevronDown
                        size={12}
                        color={C.textMuted}
                        style={{
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                          flexShrink: 0,
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 12px 12px", paddingLeft: 47 }}>
                        <div
                          style={{
                            fontSize: 12,
                            color: C.textSec,
                            lineHeight: 1.55,
                            marginBottom: 7,
                          }}
                        >
                          {dept.desc}
                        </div>
                        <a
                          href={`mailto:${dept.email}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.primary,
                            textDecoration: "none",
                          }}
                        >
                          <Mail size={11} />
                          {dept.email}
                          <ExternalLink size={10} color={C.textMuted} />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — FORM ── */}
        <div
          className="contact-form-panel"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "48px 56px 60px",
          }}
        >
          {status === "sent" ? (
            /* Success state */
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                maxWidth: 460,
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: C.successBg,
                  border: `2px solid ${C.pale}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <CheckCircle size={32} color={C.successText} />
              </div>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: C.text,
                  margin: "0 0 10px",
                  letterSpacing: "-0.4px",
                }}
              >
                Message sent successfully
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: C.textSec,
                  lineHeight: 1.65,
                  margin: "0 0 28px",
                }}
              >
                Thank you for reaching out. We will respond to{" "}
                <strong style={{ color: C.text }}>{fields.email}</strong> within
                one working day. Please reference your message when following
                up.
              </p>
              <div
                style={{
                  background: C.canvas,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                  fontSize: 13,
                  color: C.textSec,
                  lineHeight: 1.6,
                  width: "100%",
                  textAlign: "left" as const,
                }}
              >
                <strong
                  style={{
                    color: C.text,
                    display: "block",
                    marginBottom: 5,
                    fontSize: 13,
                  }}
                >
                  What happens next?
                </strong>
                Your enquiry has been routed to the appropriate department.
                Check your inbox for a confirmation email. If you don&apos;t
                receive it within 30 minutes, check your spam folder.
              </div>
            </div>
          ) : (
            /* Form */
            <>
              <div style={{ marginBottom: 36 }}>
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: C.text,
                    margin: "0 0 6px",
                    letterSpacing: "-0.4px",
                  }}
                >
                  Send us a message
                </h2>
                <p style={{ fontSize: 14, color: C.textSec, margin: 0 }}>
                  Fields marked{" "}
                  <span style={{ color: C.errorText, fontWeight: 700 }}>*</span>{" "}
                  are required. Typical response time: 1 working day.
                </p>
              </div>

              <form onSubmit={submit} noValidate>
                <div
                  className="contact-form-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px 24px",
                  }}
                >
                  {/* Full name */}
                  <FormField
                    label="Full Name"
                    required
                    error={touched.name ? errors.name : ""}
                  >
                    <StyledInput
                      placeholder="e.g. Aisha Musa Ibrahim"
                      value={fields.name}
                      onChange={(v) => update("name", v)}
                      onBlur={() => blur("name")}
                      hasError={!!(touched.name && errors.name)}
                    />
                  </FormField>

                  {/* Email */}
                  <FormField
                    label="Email Address"
                    required
                    error={touched.email ? errors.email : ""}
                  >
                    <StyledInput
                      type="email"
                      placeholder="you@example.com"
                      value={fields.email}
                      onChange={(v) => update("email", v)}
                      onBlur={() => blur("email")}
                      hasError={!!(touched.email && errors.email)}
                    />
                  </FormField>

                  {/* Phone */}
                  <FormField label="Phone Number (optional)">
                    <StyledInput
                      type="tel"
                      placeholder="+234 (0) 800 000 0000"
                      value={fields.phone}
                      onChange={(v) => update("phone", v)}
                      onBlur={() => blur("phone")}
                    />
                  </FormField>

                  {/* Department */}
                  <FormField label="Department (optional)">
                    <StyledSelect
                      value={fields.department}
                      onChange={(v) => update("department", v)}
                      options={["", ...DEPARTMENTS.map((d) => d.label)]}
                      placeholder="Route to a specific team…"
                    />
                  </FormField>

                  {/* Subject — full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FormField
                      label="Subject"
                      required
                      error={touched.subject ? errors.subject : ""}
                    >
                      <StyledSelect
                        value={fields.subject}
                        onChange={(v) => update("subject", v)}
                        options={["", ...SUBJECTS]}
                        placeholder="Select a subject…"
                        hasError={!!(touched.subject && errors.subject)}
                      />
                    </FormField>
                  </div>

                  {/* Reference ID — full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FormField
                      label="Reference ID (Application / RRR)"
                      hint="Include this if your message relates to a specific application or payment"
                    >
                      <StyledInput
                        placeholder="e.g. APP-2025-00341 or RRR-270007680283"
                        value={fields.refId}
                        onChange={(v) => update("refId", v)}
                        onBlur={() => blur("refId")}
                        mono
                      />
                    </FormField>
                  </div>

                  {/* Message — full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FormField
                      label="Message"
                      required
                      error={touched.message ? errors.message : ""}
                      hint={`${fields.message.length} / 1,000 characters`}
                    >
                      <StyledTextarea
                        placeholder="Describe your question or issue in detail. The more specific you are, the faster we can help."
                        value={fields.message}
                        onChange={(v) => update("message", v)}
                        onBlur={() => blur("message")}
                        hasError={!!(touched.message && errors.message)}
                        rows={5}
                      />
                    </FormField>
                  </div>
                </div>

                {/* Submit row */}
                <div
                  className="contact-submit-row"
                  style={{
                    marginTop: 28,
                    paddingTop: 24,
                    borderTop: `1px solid ${C.borderSubtle}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    style={{
                      height: 46,
                      padding: "0 28px",
                      borderRadius: 10,
                      border: "none",
                      background:
                        status === "sending"
                          ? C.primary
                          : `linear-gradient(180deg, ${C.medium}, ${C.primary})`,
                      color: C.white,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: status === "sending" ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: shadow.elev1,
                      opacity: status === "sending" ? 0.85 : 1,
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2
                          size={16}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Send Message
                      </>
                    )}
                  </button>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.textSec,
                        marginBottom: 2,
                      }}
                    >
                      Response within 1 working day
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>
                      By submitting you agree to our{" "}
                      <a
                        href="#"
                        style={{ color: C.primary, textDecoration: "none" }}
                      >
                        privacy policy
                      </a>
                      .
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
