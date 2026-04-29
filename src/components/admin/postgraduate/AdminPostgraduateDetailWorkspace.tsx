"use client";

import { useState } from "react";
import type { AdminPostgraduateDetail } from "@/features/postgraduate/catalogue";

export function AdminPostgraduateDetailWorkspace({ detail }: { detail: AdminPostgraduateDetail }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: detail.programme.title,
    slug: detail.programme.slug,
    code: detail.programme.code,
    status: detail.programme.status,
    deadline: detail.programme.deadline,
    startDate: detail.programme.start_date,
    mode: detail.programme.mode,
    duration: detail.programme.duration,
    fee: String(detail.programme.fees),
    overview: detail.programme.overview,
    outcomes: detail.programme.outcomes.join("\n"),
    eligibility: detail.programme.eligibility,
    requiredDocuments: detail.programme.required_documents.join("\n"),
  });

  async function saveProgramme() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/postgraduate/${detail.programme.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          code: form.code,
          status: form.status,
          deadline: form.deadline,
          start_date: form.startDate,
          mode: form.mode,
          duration: form.duration,
          fees: Number(form.fee || 0),
          overview: form.overview,
          outcomes: form.outcomes.split("\n").map((item) => item.trim()).filter(Boolean),
          eligibility: form.eligibility,
          required_documents: form.requiredDocuments.split("\n").map((item) => item.trim()).filter(Boolean),
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.error || "Could not save postgraduate programme.");
      setMessage("Programme saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save postgraduate programme.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Programme details</div>
        <div className="admin-postgraduate-detail-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Programme title" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} placeholder="Slug" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} placeholder="Programme code" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as typeof prev.status }))} style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closing_soon">Closing soon</option>
            <option value="closed">Closed</option>
          </select>
          <input value={form.deadline} onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))} placeholder="Application deadline" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} placeholder="Start date" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={form.mode} onChange={(e) => setForm((prev) => ({ ...prev, mode: e.target.value }))} placeholder="Mode" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={form.duration} onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))} placeholder="Duration" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={form.fee} onChange={(e) => setForm((prev) => ({ ...prev, fee: e.target.value }))} placeholder="Application fee" inputMode="numeric" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={form.eligibility} onChange={(e) => setForm((prev) => ({ ...prev, eligibility: e.target.value }))} placeholder="Eligibility" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <textarea value={form.overview} onChange={(e) => setForm((prev) => ({ ...prev, overview: e.target.value }))} placeholder="Overview" className="admin-postgraduate-detail-span" style={{ minHeight: 120, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
          <textarea value={form.outcomes} onChange={(e) => setForm((prev) => ({ ...prev, outcomes: e.target.value }))} placeholder="Learning outcomes, one per line" className="admin-postgraduate-detail-span" style={{ minHeight: 120, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
          <textarea value={form.requiredDocuments} onChange={(e) => setForm((prev) => ({ ...prev, requiredDocuments: e.target.value }))} placeholder="Required documents, one per line" className="admin-postgraduate-detail-span" style={{ minHeight: 120, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
        </div>
        <button type="button" onClick={() => void saveProgramme()} disabled={saving} style={{ width: "fit-content", border: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: saving ? "progress" : "pointer" }}>
          {saving ? "Saving..." : "Save postgraduate programme"}
        </button>
      </section>

      {message ? <div style={{ color: message.toLowerCase().includes("could not") ? "var(--status-error-text)" : "var(--green-primary)", fontSize: 13 }}>{message}</div> : null}

      <style>{`
        .admin-postgraduate-detail-span {
          grid-column: 1 / -1;
        }
        @media (max-width: 1040px) {
          .admin-postgraduate-detail-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
