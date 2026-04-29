"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import type { AdminTrainingRegistrationItem } from "@/features/training/workspace";

type Props = {
  registrations: AdminTrainingRegistrationItem[];
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function AdminTrainingRegistrationsManager({ registrations: initialRegistrations }: Props) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function approveRegistration(registrationId: string) {
    if (!window.confirm("Approve this training registration?")) return;
    setProcessing(registrationId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/training/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", registrationId }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not approve registration.");
      }
      setRegistrations((prev) =>
        prev.map((item) =>
          item.id === registrationId
            ? { ...item, applicationStatus: "approved", portalState: "upcoming" }
            : item
        )
      );
      setMessage("Registration approved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not approve registration.");
    } finally {
      setProcessing(null);
    }
  }

  async function rejectRegistration(registrationId: string) {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    if (!window.confirm("Reject this training registration?")) return;
    setProcessing(registrationId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/training/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", registrationId, reason }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not reject registration.");
      }
      setRegistrations((prev) =>
        prev.map((item) =>
          item.id === registrationId
            ? { ...item, applicationStatus: "rejected", portalState: "registration_rejected", adminNotes: reason }
            : item
        )
      );
      setMessage("Registration rejected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reject registration.");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Link href="/admin/dashboard" style={{ width: "fit-content", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--green-primary)", fontSize: 13, fontWeight: 700 }}>
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, overflow: "hidden" }}>
        <div className="admin-training-registrations-head" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.8fr 0.8fr auto", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <div>Participant</div>
          <div>Programme</div>
          <div>Registration</div>
          <div>Payment</div>
          <div>Date</div>
          <div />
        </div>

        {registrations.map((registration) => {
          const canReview = registration.applicationStatus === "pending" || registration.applicationStatus === "review";
          return (
            <div key={registration.id} className="admin-training-registrations-row" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.8fr 0.8fr auto", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{registration.participantName}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>{registration.participantEmail || "No email"}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 700 }}>{registration.trainingTitle}</div>
                <Link href={`/admin/training/${registration.trainingId}`} style={{ display: "inline-block", marginTop: 6, color: "var(--green-primary)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  Open programme
                </Link>
              </div>
              <div style={{ textTransform: "capitalize", color: "var(--text-secondary)", fontSize: 13 }}>{statusLabel(registration.applicationStatus)}</div>
              <div style={{ textTransform: "capitalize", color: "var(--text-secondary)", fontSize: 13 }}>{statusLabel(registration.paymentStatus)}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{formatDate(registration.enrolledAt)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                {canReview ? (
                  <>
                    <button type="button" onClick={() => void approveRegistration(registration.id)} disabled={processing === registration.id} style={{ border: "none", background: "var(--status-success-bg)", color: "var(--status-success-text)", borderRadius: 10, padding: "8px 12px", cursor: processing === registration.id ? "progress" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
                      <CheckCircle2 size={12} /> {processing === registration.id ? "..." : "Approve"}
                    </button>
                    <button type="button" onClick={() => void rejectRegistration(registration.id)} disabled={processing === registration.id} style={{ border: "none", background: "var(--status-error-bg)", color: "var(--status-error-text)", borderRadius: 10, padding: "8px 12px", cursor: processing === registration.id ? "progress" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
                      <XCircle size={12} /> {processing === registration.id ? "..." : "Reject"}
                    </button>
                  </>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{statusLabel(registration.portalState)}</span>
                )}
              </div>
            </div>
          );
        })}

        {registrations.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", padding: 40, textAlign: "center" }}>No training registrations found.</div>
        ) : null}
      </section>

      {message ? <div style={{ color: message.toLowerCase().includes("could not") ? "var(--status-error-text)" : "var(--green-primary)", fontSize: 13 }}>{message}</div> : null}

      <style>{`
        @media (max-width: 1040px) {
          .admin-training-registrations-head {
            display: none !important;
          }
          .admin-training-registrations-row {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
