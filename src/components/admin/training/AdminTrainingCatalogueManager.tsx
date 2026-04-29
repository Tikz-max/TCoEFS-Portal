"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminTrainingListItem } from "@/features/training/workspace";

function currency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

type Props = {
  trainings: AdminTrainingListItem[];
  canManageProgrammes: boolean;
};

export function AdminTrainingCatalogueManager({
  trainings: initialTrainings,
  canManageProgrammes,
}: Props) {
  const [trainings, setTrainings] = useState(initialTrainings);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    breadcrumbLabel: "",
    categoryLabel: "",
    modeLabel: "",
    durationLabel: "",
    feeSubLabel: "",
    registrationDeadline: "",
    outcomes: "",
    audience: "",
    contactEmail: "",
    contactPhone: "",
    venue: "",
    fees: "",
    capacity: "",
    status: "draft",
  });

  async function createProgramme() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          description: form.description,
          venue: form.venue,
          fees: Number(form.fees || 0),
          capacity: form.capacity ? Number(form.capacity) : null,
          status: form.status,
          breadcrumbLabel: form.breadcrumbLabel,
          categoryLabel: form.categoryLabel,
          modeLabel: form.modeLabel,
          durationLabel: form.durationLabel,
          feeSubLabel: form.feeSubLabel,
          registrationDeadline: form.registrationDeadline,
          outcomes: form.outcomes.split("\n").map((item) => item.trim()).filter(Boolean),
          audience: form.audience.split("\n").map((item) => item.trim()).filter(Boolean),
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not create training programme.");
      }
      window.location.href = `/admin/training/${body.data.id}`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create training programme.");
      setSaving(false);
    }
  }

  async function deleteProgramme(training: AdminTrainingListItem) {
    const confirmed = window.confirm(
      `Delete ${training.title}? This cannot be undone.`
    );
    if (!confirmed) return;

    setMessage(null);
    try {
      const res = await fetch(`/api/admin/training/${training.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not delete training programme.");
      }
      setTrainings((prev) => prev.filter((item) => item.id !== training.id));
      setMessage("Training programme deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete training programme.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {canManageProgrammes ? (
        <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Add programme</div>
          <div className="admin-training-form-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Programme title" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} placeholder="Slug (optional)" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={form.breadcrumbLabel} onChange={(e) => setForm((prev) => ({ ...prev, breadcrumbLabel: e.target.value }))} placeholder="Breadcrumb label" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={form.categoryLabel} onChange={(e) => setForm((prev) => ({ ...prev, categoryLabel: e.target.value }))} placeholder="Category label" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={form.venue} onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))} placeholder="Venue" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="registration_closed">Registration closed</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
            <input value={form.modeLabel} onChange={(e) => setForm((prev) => ({ ...prev, modeLabel: e.target.value }))} placeholder="Mode label" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={form.durationLabel} onChange={(e) => setForm((prev) => ({ ...prev, durationLabel: e.target.value }))} placeholder="Duration label" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={form.fees} onChange={(e) => setForm((prev) => ({ ...prev, fees: e.target.value }))} placeholder="Fee" inputMode="numeric" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={form.capacity} onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))} placeholder="Seat capacity" inputMode="numeric" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={form.feeSubLabel} onChange={(e) => setForm((prev) => ({ ...prev, feeSubLabel: e.target.value }))} placeholder="Fee sub-label" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={form.registrationDeadline} onChange={(e) => setForm((prev) => ({ ...prev, registrationDeadline: e.target.value }))} placeholder="Registration deadline" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={form.contactEmail} onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))} placeholder="Contact email" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={form.contactPhone} onChange={(e) => setForm((prev) => ({ ...prev, contactPhone: e.target.value }))} placeholder="Contact phone" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Programme overview" className="admin-training-form-span" style={{ minHeight: 110, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
            <textarea value={form.outcomes} onChange={(e) => setForm((prev) => ({ ...prev, outcomes: e.target.value }))} placeholder="Learning outcomes, one per line" className="admin-training-form-span" style={{ minHeight: 110, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
            <textarea value={form.audience} onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))} placeholder="Who should attend, one per line" className="admin-training-form-span" style={{ minHeight: 110, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
          </div>
          <button type="button" onClick={() => void createProgramme()} disabled={saving} style={{ width: "fit-content", border: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: saving ? "progress" : "pointer" }}>
            {saving ? "Creating..." : "Create training programme"}
          </button>
        </section>
      ) : null}

      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, overflow: "hidden" }}>
        <div className="admin-training-table-head" style={{ display: "grid", gridTemplateColumns: canManageProgrammes ? "1.5fr 0.7fr 0.8fr 0.7fr 0.8fr 0.8fr auto auto" : "1.6fr 0.7fr 0.8fr 0.8fr 0.8fr auto", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <div>Programme</div>
          <div>Status</div>
          <div>Venue</div>
          <div>Fee</div>
          <div>Paid / Seats</div>
          <div>Regs / Materials</div>
          <div />
          {canManageProgrammes ? <div /> : null}
        </div>
        {trainings.map((training) => (
          <div key={training.id} className="admin-training-table-row" style={{ display: "grid", gridTemplateColumns: canManageProgrammes ? "1.5fr 0.7fr 0.8fr 0.7fr 0.8fr 0.8fr auto auto" : "1.6fr 0.7fr 0.8fr 0.8fr 0.8fr auto", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{training.title}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>{training.slug}</div>
            </div>
            <div style={{ textTransform: "capitalize", color: "var(--text-secondary)", fontSize: 13 }}>{training.status.replaceAll("_", " ")}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{training.venue || "-"}</div>
            <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 700 }}>{currency(training.fees)}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {training.paidRegistrations} / {training.capacity ?? "-"}
              {training.seatsRemaining != null ? ` (${training.seatsRemaining} left)` : ""}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{training.registrations} / {training.materials}</div>
            <Link href={`/admin/training/${training.id}`} style={{ textDecoration: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", fontSize: 13, fontWeight: 700, justifySelf: "start" }}>
              Manage
            </Link>
            {canManageProgrammes ? (
              <button type="button" onClick={() => void deleteProgramme(training)} disabled={!training.canDelete} style={{ border: "none", background: training.canDelete ? "var(--status-error-bg)" : "var(--bg-surface-light)", color: training.canDelete ? "var(--status-error-text)" : "var(--text-muted)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 700, cursor: training.canDelete ? "pointer" : "not-allowed" }}>
                Delete
              </button>
            ) : null}
          </div>
        ))}
      </section>

      {message ? <div style={{ color: message.toLowerCase().includes("could not") || message.toLowerCase().includes("cannot") ? "var(--status-error-text)" : "var(--green-primary)", fontSize: 13 }}>{message}</div> : null}

      <style>{`
        .admin-training-form-span {
          grid-column: 1 / -1;
        }
        @media (max-width: 1040px) {
          .admin-training-table-head {
            display: none !important;
          }
          .admin-training-table-row,
          .admin-training-form-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
