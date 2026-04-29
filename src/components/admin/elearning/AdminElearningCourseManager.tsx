"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { AdminElearningListItem } from "@/features/elearning";

export function AdminElearningCourseManager({
  courses: initialCourses,
}: {
  courses: AdminElearningListItem[];
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnail: "",
  });

  async function createCourse() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/elearning/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          thumbnail: form.thumbnail.trim() || null,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body?.success) {
        throw new Error(body?.error || "Could not create course.");
      }
      window.location.href = `/admin/elearning/${body.data.courseId}`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create course.");
      setSaving(false);
    }
  }

  async function deleteCourse(course: AdminElearningListItem) {
    if (!course.canDelete) return;
    if (!window.confirm(`Delete ${course.title}? This cannot be undone.`)) return;

    setMessage(null);
    try {
      const response = await fetch(`/api/elearning/courses/${course.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok || !body?.success) {
        throw new Error(body?.error || "Could not delete course.");
      }
      setCourses((current) => current.filter((item) => item.id !== course.id));
      setMessage("Course deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete course.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Create e-learning course</div>
        <div style={{ display: "grid", gap: 12 }}>
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Course title" style={fieldStyle} />
          <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Course description" style={{ ...fieldStyle, minHeight: 120, resize: "vertical" }} />
          <input value={form.thumbnail} onChange={(event) => setForm((current) => ({ ...current, thumbnail: event.target.value }))} placeholder="Thumbnail URL (optional)" style={fieldStyle} />
        </div>
        <button type="button" onClick={() => void createCourse()} disabled={saving} style={primaryButtonStyle}>
          {saving ? "Creating..." : "Create course"}
        </button>
      </section>

      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, overflow: "hidden" }}>
        <div className="admin-elearning-table-head" style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.8fr 0.8fr auto auto", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <div>Course</div>
          <div>Status</div>
          <div>Modules</div>
          <div>Quizzes</div>
          <div>Enrollments</div>
          <div />
          <div />
        </div>
        {courses.map((course) => (
          <div key={course.id} className="admin-elearning-table-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.8fr 0.8fr auto auto", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{course.title}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>{course.slug} · {course.creatorName}</div>
            </div>
            <div style={{ textTransform: "capitalize", color: "var(--text-secondary)", fontSize: 13 }}>{course.status.replaceAll("_", " ")}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{course.moduleCount}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{course.quizCount}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{course.enrollmentCount}</div>
            <Link href={`/admin/elearning/${course.id}`} style={{ ...primaryButtonStyle, textDecoration: "none", justifySelf: "start" }}>Manage</Link>
            <button type="button" onClick={() => void deleteCourse(course)} disabled={!course.canDelete} style={{ border: "none", background: course.canDelete ? "var(--status-error-bg)" : "var(--bg-surface-light)", color: course.canDelete ? "var(--status-error-text)" : "var(--text-muted)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 700, cursor: course.canDelete ? "pointer" : "not-allowed" }}>
              Delete
            </button>
          </div>
        ))}
      </section>

      {message ? <div style={{ color: message.toLowerCase().includes("could not") ? "var(--status-error-text)" : "var(--green-primary)", fontSize: 13 }}>{message}</div> : null}

      <style>{`
        @media (max-width: 1040px) {
          .admin-elearning-table-head {
            display: none !important;
          }
          .admin-elearning-table-row {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
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
