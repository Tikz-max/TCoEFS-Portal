"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminPostgraduateListItem } from "@/features/postgraduate/catalogue";

function currency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminPostgraduateCatalogueManager({
  programmes: initialProgrammes,
  canDelete,
}: {
  programmes: AdminPostgraduateListItem[];
  canDelete: boolean;
}) {
  const [programmes, setProgrammes] = useState(initialProgrammes);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    code: "",
    status: "draft",
    deadline: "",
    startDate: "",
    mode: "",
    duration: "",
    fee: "",
    overview: "",
    outcomes: "",
    eligibility: "",
    requiredDocuments: "",
  });

  async function createProgramme() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/postgraduate", {
        method: "POST",
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
      if (!res.ok || !body?.success) throw new Error(body?.error || "Could not create postgraduate programme.");
      window.location.href = `/admin/postgraduate/${body.data.id}`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create postgraduate programme.");
      setSaving(false);
    }
  }

  async function deleteProgramme(programme: AdminPostgraduateListItem) {
    if (!window.confirm(`Delete ${programme.title}? This cannot be undone.`)) return;
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/postgraduate/${programme.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error(body?.error || "Could not delete postgraduate programme.");
      setProgrammes((prev) => prev.filter((item) => item.id !== programme.id));
      setMessage("Postgraduate programme deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete postgraduate programme.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Add postgraduate programme</div>
        <div className="admin-postgraduate-form-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Programme title" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} placeholder="Slug (optional)" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} placeholder="Programme code" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }}>
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
          <textarea value={form.overview} onChange={(e) => setForm((prev) => ({ ...prev, overview: e.target.value }))} placeholder="Programme overview" className="admin-postgraduate-span" style={{ minHeight: 110, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
          <textarea value={form.outcomes} onChange={(e) => setForm((prev) => ({ ...prev, outcomes: e.target.value }))} placeholder="Learning outcomes, one per line" className="admin-postgraduate-span" style={{ minHeight: 110, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
          <textarea value={form.requiredDocuments} onChange={(e) => setForm((prev) => ({ ...prev, requiredDocuments: e.target.value }))} placeholder="Required documents, one per line" className="admin-postgraduate-span" style={{ minHeight: 110, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
        </div>
        <button type="button" onClick={() => void createProgramme()} disabled={saving} style={{ width: "fit-content", border: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: saving ? "progress" : "pointer" }}>
          {saving ? "Creating..." : "Create postgraduate programme"}
        </button>
      </section>

      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, overflow: "hidden" }}>
        <div className="admin-postgraduate-table-head" style={{ display: "grid", gridTemplateColumns: canDelete ? "1.5fr 0.7fr 0.8fr 0.8fr 0.8fr auto auto" : "1.5fr 0.7fr 0.8fr 0.8fr 0.8fr auto", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <div>Programme</div>
          <div>Status</div>
          <div>Deadline</div>
          <div>Mode</div>
          <div>Fee</div>
          <div />
          {canDelete ? <div /> : null}
        </div>
        {programmes.map((programme) => (
          <div key={programme.id} className="admin-postgraduate-table-row" style={{ display: "grid", gridTemplateColumns: canDelete ? "1.5fr 0.7fr 0.8fr 0.8fr 0.8fr auto auto" : "1.5fr 0.7fr 0.8fr 0.8fr 0.8fr auto", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{programme.title}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>{programme.code} · {programme.slug}</div>
            </div>
            <div style={{ textTransform: "capitalize", color: "var(--text-secondary)", fontSize: 13 }}>{programme.status.replaceAll("_", " ")}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{programme.deadline}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{programme.mode}</div>
            <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 700 }}>{currency(programme.fees)}</div>
            <Link href={`/admin/postgraduate/${programme.id}`} style={{ textDecoration: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", fontSize: 13, fontWeight: 700, justifySelf: "start" }}>
              Manage
            </Link>
            {canDelete ? <button type="button" onClick={() => void deleteProgramme(programme)} disabled={!programme.canDelete} style={{ border: "none", background: programme.canDelete ? "var(--status-error-bg)" : "var(--bg-surface-light)", color: programme.canDelete ? "var(--status-error-text)" : "var(--text-muted)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 700, cursor: programme.canDelete ? "pointer" : "not-allowed" }}>Delete</button> : null}
          </div>
        ))}
      </section>

      {message ? <div style={{ color: message.toLowerCase().includes("could not") ? "var(--status-error-text)" : "var(--green-primary)", fontSize: 13 }}>{message}</div> : null}

      <style>{`
        .admin-postgraduate-span {
          grid-column: 1 / -1;
        }
        @media (max-width: 1040px) {
          .admin-postgraduate-table-head {
            display: none !important;
          }
          .admin-postgraduate-table-row,
          .admin-postgraduate-form-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
