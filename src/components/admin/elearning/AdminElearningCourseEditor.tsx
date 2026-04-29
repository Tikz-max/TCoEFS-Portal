"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { AdminElearningDetail } from "@/features/elearning";

export function AdminElearningCourseEditor({
  detail,
}: {
  detail: AdminElearningDetail;
}) {
  const [form, setForm] = useState({
    title: detail.course.title,
    description: detail.course.description,
    thumbnail: detail.course.thumbnail || "",
    status: detail.course.status,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveCourse() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/elearning/courses/${detail.course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          thumbnail: form.thumbnail.trim() || null,
          status: form.status,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body?.success) {
        throw new Error(body?.error || "Could not update course.");
      }
      setMessage("Course updated.");
      window.location.href = "/admin/elearning";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update course.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse() {
    if (!detail.canDelete) return;
    if (!window.confirm(`Delete ${detail.course.title}? This cannot be undone.`)) return;

    setDeleting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/elearning/courses/${detail.course.id}`, {
        method: "DELETE",
      });
      const body = await response.json();
      if (!response.ok || !body?.success) {
        throw new Error(body?.error || "Could not delete course.");
      }
      window.location.href = "/admin/elearning";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete course.");
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 22, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Course overview</div>
            <h1 style={{ margin: "8px 0 0", fontSize: 30, color: "var(--text-primary)" }}>{detail.course.title}</h1>
            <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
              Created by {detail.course.creatorName}. Manage the core course metadata here. Module creation and learner delivery continue to use the live course APIs.
            </p>
          </div>
          <Link href="/admin/elearning" style={{ textDecoration: "none", color: "var(--green-primary)", fontSize: 13, fontWeight: 700 }}>
            Back to course list
          </Link>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <SummaryCard label="Status" value={detail.course.status.replaceAll("_", " ")} />
          <SummaryCard label="Modules" value={String(detail.course.modules.length)} />
          <SummaryCard label="Enrollments" value={String(detail.course.enrollmentCount)} />
        </div>
      </section>

      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Edit course</div>
        <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Course title" style={fieldStyle} />
        <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Course description" style={{ ...fieldStyle, minHeight: 140, resize: "vertical" }} />
        <input value={form.thumbnail} onChange={(event) => setForm((current) => ({ ...current, thumbnail: event.target.value }))} placeholder="Thumbnail URL" style={fieldStyle} />
        <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as typeof form.status }))} style={fieldStyle}>
          <option value="draft">Draft</option>
          <option value="pending_publish">Pending publish</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => void saveCourse()} disabled={saving} style={primaryButtonStyle}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          {detail.canDelete ? (
            <button type="button" onClick={() => void deleteCourse()} disabled={deleting} style={dangerButtonStyle}>
              {deleting ? "Deleting..." : "Delete course"}
            </button>
          ) : null}
        </div>
      </section>

      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Modules in this course</div>
        {detail.course.modules.length === 0 ? (
          <div style={{ color: "var(--text-secondary)" }}>No modules have been added yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {detail.course.modules.map((module) => (
              <div key={module.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{module.title}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  {module.content_type} · order {module.order + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {message ? <div style={{ color: message.toLowerCase().includes("could not") ? "var(--status-error-text)" : "var(--green-primary)", fontSize: 13 }}>{message}</div> : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--bg-surface-light)", borderRadius: 14, padding: 14, border: "1px solid var(--border-subtle)" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

const fieldStyle: CSSProperties = {
  border: "none",
  boxShadow: "var(--shadow-inset)",
  borderRadius: 10,
  padding: "10px 12px",
  background: "var(--bg-surface-light)",
};

const primaryButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)",
  color: "#fff",
  borderRadius: 10,
  boxShadow: "var(--elevation-1)",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "var(--status-error-bg)",
  color: "var(--status-error-text)",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};
