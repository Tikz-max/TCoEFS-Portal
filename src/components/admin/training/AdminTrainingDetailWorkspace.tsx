"use client";

import { useState } from "react";
import { Download, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import type { AdminTrainingDetail, TrainingScheduleDay } from "@/features/training/workspace";

function newDay(): TrainingScheduleDay {
  return {
    id: crypto.randomUUID(),
    dayNumber: 1,
    date: "",
    moduleLabel: "Module",
    topic: "",
    location: "",
    sessions: [],
  };
}

export function AdminTrainingDetailWorkspace({ detail, canManageProgramme = false }: { detail: AdminTrainingDetail; canManageProgramme?: boolean }) {
  const [schedule, setSchedule] = useState<TrainingScheduleDay[]>(detail.training.schedule || []);
  const [materials, setMaterials] = useState(detail.materials);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [programmeSaving, setProgrammeSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  async function confirmRegistration(registrationId: string) {
    if (!window.confirm("Confirm this participant registration?")) return;
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
        throw new Error(body?.error || "Could not confirm registration.");
      }
      setMessage("Registration confirmed.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not confirm.");
    } finally {
      setProcessing(null);
    }
  }

  async function rejectRegistration(registrationId: string) {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;
    if (!window.confirm(`Reject this registration? This cannot be undone.`)) return;
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
      setMessage("Registration rejected.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reject.");
    } finally {
      setProcessing(null);
    }
  }
  const [programme, setProgramme] = useState({
    title: detail.training.title,
    slug: detail.training.slug,
    description: detail.training.description,
    breadcrumbLabel: detail.training.breadcrumbLabel || "",
    categoryLabel: detail.training.categoryLabel || "",
    modeLabel: detail.training.modeLabel || "",
    durationLabel: detail.training.durationLabel || "",
    feeSubLabel: detail.training.feeSubLabel || "",
    registrationDeadline: detail.training.registrationDeadline || "",
    outcomes: (detail.training.outcomes || []).join("\n"),
    audience: (detail.training.audience || []).join("\n"),
    contactEmail: detail.training.contactEmail || "",
    contactPhone: detail.training.contactPhone || "",
    venue: detail.training.venue || "",
    fees: String(detail.training.fees),
    capacity: detail.training.capacity == null ? "" : String(detail.training.capacity),
    status: detail.training.status,
    feeType: detail.training.feeType || "single",
    feeTiers: (detail.training.feeTiers || []).map((t) => `${t.label}|${t.amount}`).join("\n"),
  });
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    phase: "pre_training",
    sessionLabel: "",
    materialType: "PDF",
    sortOrder: "0",
  });

  async function saveSchedule() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/training/${detail.training.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not save schedule.");
      }
      setMessage("Schedule saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save schedule.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadMaterial(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("title", uploadForm.title);
      formData.set("description", uploadForm.description);
      formData.set("phase", uploadForm.phase);
      formData.set("sessionLabel", uploadForm.sessionLabel);
      formData.set("materialType", uploadForm.materialType);
      formData.set("sortOrder", uploadForm.sortOrder);
      formData.set("file", file);

      const res = await fetch(`/api/admin/training/${detail.training.id}/materials/upload`, {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not upload material.");
      }
      const row = body.data;
      setMaterials((prev) => [
        ...prev,
        {
          id: row.id,
          title: row.title,
          description: row.description,
          phase: row.phase,
          sessionLabel: row.session_label,
          materialType: row.material_type,
          fileName: row.file_name,
          fileSizeBytes: row.file_size_bytes,
          isPublished: row.is_published,
          createdAt: row.created_at,
        },
      ]);
      setUploadForm({ title: "", description: "", phase: "pre_training", sessionLabel: "", materialType: "PDF", sortOrder: "0" });
      setMessage("Material uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not upload material.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteMaterial(materialId: string) {
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/training/materials/${materialId}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not delete material.");
      }
      setMaterials((prev) => prev.filter((item) => item.id !== materialId));
      setMessage("Material deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete material.");
    }
  }

  async function saveProgramme() {
    setProgrammeSaving(true);
    setMessage(null);
    try {
      const feeTiers = programme.feeType === "tiered"
        ? programme.feeTiers.split("\n").map((line) => {
            const parts = line.split("|");
            return { label: parts[0]?.trim() || "", amount: Number(parts[1]) || 0 };
          }).filter((t) => t.label && t.amount > 0)
        : [];
      const res = await fetch(`/api/admin/training/${detail.training.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: programme.title,
          slug: programme.slug,
          description: programme.description,
          venue: programme.venue,
          fees: Number(programme.fees || 0),
          capacity: programme.capacity ? Number(programme.capacity) : null,
          status: programme.status,
          breadcrumbLabel: programme.breadcrumbLabel,
          categoryLabel: programme.categoryLabel,
          modeLabel: programme.modeLabel,
          durationLabel: programme.durationLabel,
          feeSubLabel: programme.feeSubLabel,
          registrationDeadline: programme.registrationDeadline,
          outcomes: programme.outcomes.split("\n").map((item) => item.trim()).filter(Boolean),
          audience: programme.audience.split("\n").map((item) => item.trim()).filter(Boolean),
          contactEmail: programme.contactEmail,
          contactPhone: programme.contactPhone,
          feeType: programme.feeType,
          feeTiers,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Could not save programme.");
      }
      setMessage("Programme saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save programme.");
    } finally {
      setProgrammeSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {canManageProgramme ? (
        <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Public catalogue entry</div>
              <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Programme details</div>
            </div>
            <div style={{ alignSelf: "flex-start", borderRadius: 999, padding: "7px 10px", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", background: "var(--bg-surface-light)" }}>
              {detail.paidRegistrations} paid · {detail.training.capacity ?? "-"} capacity
            </div>
          </div>

          <div className="admin-programme-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <input value={programme.title} onChange={(e) => setProgramme((prev) => ({ ...prev, title: e.target.value }))} placeholder="Programme title" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={programme.slug} onChange={(e) => setProgramme((prev) => ({ ...prev, slug: e.target.value }))} placeholder="Slug" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={programme.breadcrumbLabel} onChange={(e) => setProgramme((prev) => ({ ...prev, breadcrumbLabel: e.target.value }))} placeholder="Breadcrumb label" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={programme.categoryLabel} onChange={(e) => setProgramme((prev) => ({ ...prev, categoryLabel: e.target.value }))} placeholder="Category label" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={programme.venue} onChange={(e) => setProgramme((prev) => ({ ...prev, venue: e.target.value }))} placeholder="Venue" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <select value={programme.status} onChange={(e) => setProgramme((prev) => ({ ...prev, status: e.target.value as AdminTrainingDetail["training"]["status"] }))} style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="registration_closed">Registration closed</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input value={programme.modeLabel} onChange={(e) => setProgramme((prev) => ({ ...prev, modeLabel: e.target.value }))} placeholder="Mode label" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={programme.durationLabel} onChange={(e) => setProgramme((prev) => ({ ...prev, durationLabel: e.target.value }))} placeholder="Duration label" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={programme.fees} onChange={(e) => setProgramme((prev) => ({ ...prev, fees: e.target.value }))} placeholder="Fee" inputMode="numeric" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <select value={programme.feeType} onChange={(e) => setProgramme((prev) => ({ ...prev, feeType: e.target.value as "single" | "tiered" }))} style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }}>
              <option value="single">Single Fee</option>
              <option value="tiered">Tiered Fees</option>
            </select>
            {programme.feeType === "tiered" && (
              <>
                <input value={programme.feeTiers} onChange={(e) => setProgramme((prev) => ({ ...prev, feeTiers: e.target.value }))} placeholder="Fee tiers (label|amount, one per line)" className="admin-programme-grid-span" style={{ minHeight: 80, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
              </>
            )}
            <input value={programme.capacity} onChange={(e) => setProgramme((prev) => ({ ...prev, capacity: e.target.value }))} placeholder="Seat capacity" inputMode="numeric" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={programme.feeSubLabel} onChange={(e) => setProgramme((prev) => ({ ...prev, feeSubLabel: e.target.value }))} placeholder="Fee sub-label" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={programme.registrationDeadline} onChange={(e) => setProgramme((prev) => ({ ...prev, registrationDeadline: e.target.value }))} placeholder="Registration deadline" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={programme.contactEmail} onChange={(e) => setProgramme((prev) => ({ ...prev, contactEmail: e.target.value }))} placeholder="Contact email" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <input value={programme.contactPhone} onChange={(e) => setProgramme((prev) => ({ ...prev, contactPhone: e.target.value }))} placeholder="Contact phone" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
            <textarea value={programme.description} onChange={(e) => setProgramme((prev) => ({ ...prev, description: e.target.value }))} placeholder="Programme overview" className="admin-programme-grid-span" style={{ minHeight: 120, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
            <textarea value={programme.outcomes} onChange={(e) => setProgramme((prev) => ({ ...prev, outcomes: e.target.value }))} placeholder="Learning outcomes, one per line" className="admin-programme-grid-span" style={{ minHeight: 120, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
            <textarea value={programme.audience} onChange={(e) => setProgramme((prev) => ({ ...prev, audience: e.target.value }))} placeholder="Who should attend, one per line" className="admin-programme-grid-span" style={{ minHeight: 120, border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "12px", background: "var(--bg-surface-light)", resize: "vertical" }} />
          </div>

          <button onClick={saveProgramme} disabled={programmeSaving} style={{ width: "fit-content", border: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: programmeSaving ? "progress" : "pointer" }}>
            {programmeSaving ? "Saving..." : "Save programme"}
          </button>
        </section>
      ) : null}

      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Programme schedule</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{detail.training.title}</div>
          </div>
          <button onClick={saveSchedule} disabled={saving} style={{ border: "none", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Saving..." : "Save schedule"}
          </button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {schedule.map((day, index) => (
            <div key={day.id} style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 16, padding: 16, display: "grid", gap: 12 }}>
              <div className="admin-schedule-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "120px 170px 170px minmax(0, 1fr)" }}>
                <input value={day.dayNumber} onChange={(e) => setSchedule((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, dayNumber: Number(e.target.value || 1) } : item))} placeholder="Day" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-default)" }} />
                <input value={day.date} onChange={(e) => setSchedule((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, date: e.target.value } : item))} placeholder="Date" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-default)" }} />
                <input value={day.moduleLabel} onChange={(e) => setSchedule((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, moduleLabel: e.target.value } : item))} placeholder="Module label" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-default)" }} />
                <input value={day.topic} onChange={(e) => setSchedule((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, topic: e.target.value } : item))} placeholder="Topic" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-default)" }} />
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {day.sessions.map((session, sessionIndex) => (
                  <div key={session.id} className="admin-session-grid" style={{ display: "grid", gap: 10, gridTemplateColumns: "120px 120px minmax(0, 1fr) auto" }}>
                    <input value={session.startTime} onChange={(e) => setSchedule((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, sessions: item.sessions.map((row, rowIndex) => rowIndex === sessionIndex ? { ...row, startTime: e.target.value } : row) } : item))} placeholder="Start" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-default)" }} />
                    <input value={session.endTime} onChange={(e) => setSchedule((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, sessions: item.sessions.map((row, rowIndex) => rowIndex === sessionIndex ? { ...row, endTime: e.target.value } : row) } : item))} placeholder="End" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-default)" }} />
                    <input value={session.title} onChange={(e) => setSchedule((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, sessions: item.sessions.map((row, rowIndex) => rowIndex === sessionIndex ? { ...row, title: e.target.value } : row) } : item))} placeholder="Session title" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-default)" }} />
                    <button type="button" onClick={() => setSchedule((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, sessions: item.sessions.filter((_, rowIndex) => rowIndex !== sessionIndex) } : item))} style={{ border: "none", background: "var(--status-error-bg)", color: "var(--status-error-text)", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setSchedule((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, sessions: [...item.sessions, { id: crypto.randomUUID(), startTime: "", endTime: "", title: "", facilitator: "" }] } : item))} style={{ border: "none", background: "var(--bg-surface-default)", boxShadow: "var(--elevation-1)", color: "var(--text-secondary)", borderRadius: 10, padding: "10px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}><Plus size={14} />Add session</button>
                <button type="button" onClick={() => setSchedule((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} style={{ border: "none", background: "var(--status-error-bg)", color: "var(--status-error-text)", borderRadius: 10, padding: "10px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}><Trash2 size={14} />Remove day</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setSchedule((prev) => [...prev, newDay()])} style={{ border: "none", background: "var(--bg-surface-default)", boxShadow: "var(--elevation-1)", color: "var(--text-secondary)", borderRadius: 10, padding: "10px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content" }}><Plus size={14} />Add training day</button>
        </div>
      </section>

      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Training materials</div>

        <div className="admin-upload-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <input value={uploadForm.title} onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Material title" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={uploadForm.description} onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <select value={uploadForm.phase} onChange={(e) => setUploadForm((prev) => ({ ...prev, phase: e.target.value }))} style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }}>
            <option value="pre_training">Pre-training</option>
            <option value="session">Session</option>
            <option value="post_training">Post-training</option>
          </select>
          <input value={uploadForm.sessionLabel} onChange={(e) => setUploadForm((prev) => ({ ...prev, sessionLabel: e.target.value }))} placeholder="Session label (optional)" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={uploadForm.materialType} onChange={(e) => setUploadForm((prev) => ({ ...prev, materialType: e.target.value }))} placeholder="Type e.g. PDF" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
          <input value={uploadForm.sortOrder} onChange={(e) => setUploadForm((prev) => ({ ...prev, sortOrder: e.target.value }))} placeholder="Sort order" style={{ border: "none", boxShadow: "var(--shadow-inset)", borderRadius: 10, padding: "10px 12px", background: "var(--bg-surface-light)" }} />
        </div>

        <label style={{ display: "inline-flex", alignItems: "center", gap: 10, width: "fit-content", background: "linear-gradient(180deg, var(--green-medium) 0%, var(--green-primary) 100%)", color: "#fff", borderRadius: 10, boxShadow: "var(--elevation-1)", padding: "10px 14px", cursor: uploading ? "progress" : "pointer", fontSize: 13, fontWeight: 700 }}>
          <Download size={14} /> {uploading ? "Uploading..." : "Upload material"}
          <input type="file" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadMaterial(file); e.currentTarget.value = ""; }} disabled={uploading} />
        </label>

        <div style={{ display: "grid", gap: 10 }}>
          {materials.map((material) => (
            <div key={material.id} style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{material.title}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>{material.phase.replaceAll("_", " ")} · {material.sessionLabel || "General"} · {material.materialType} · {material.fileName}</div>
              </div>
              <button type="button" onClick={() => void deleteMaterial(material.id)} style={{ border: "none", background: "var(--status-error-bg)", color: "var(--status-error-text)", borderRadius: 10, padding: "10px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}><Trash2 size={14} />Delete</button>
            </div>
          ))}
          {materials.length === 0 ? <div style={{ color: "var(--text-secondary)" }}>No materials uploaded yet.</div> : null}
        </div>
      </section>

      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Registrations</div>
        <div style={{ display: "grid", gap: 10 }}>
          {detail.registrations.map((registration) => (
            <div key={registration.id} style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 14, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{registration.participantName}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>{registration.portalState.replaceAll("_", " ")}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "capitalize" }}>{registration.paymentStatus.replaceAll("_", " ")}</div>
                {(registration.applicationStatus === "pending" || registration.applicationStatus === "review") && (
                  <>
                    <button type="button" onClick={() => confirmRegistration(registration.id)} disabled={processing === registration.id} style={{ border: "none", background: "var(--status-success-bg)", color: "var(--status-success-text)", borderRadius: 10, padding: "8px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
                      <CheckCircle2 size={12} /> {processing === registration.id ? "..." : "Approve"}
                    </button>
                    <button type="button" onClick={() => rejectRegistration(registration.id)} disabled={processing === registration.id} style={{ border: "none", background: "var(--status-error-bg)", color: "var(--status-error-text)", borderRadius: 10, padding: "8px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
                      <XCircle size={12} /> {processing === registration.id ? "..." : "Reject"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {detail.registrations.length === 0 ? <div style={{ color: "var(--text-secondary)" }}>No participant registrations yet.</div> : null}
        </div>
      </section>

      {message ? <div style={{ color: message.toLowerCase().includes("could not") ? "var(--status-error-text)" : "var(--green-primary)", fontSize: 13 }}>{message}</div> : null}

      <style>{`
        @media (max-width: 1000px) {
          .admin-programme-grid,
          .admin-upload-grid,
          .admin-schedule-grid,
          .admin-session-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
        .admin-programme-grid-span {
          grid-column: 1 / -1;
        }
      `}</style>
    </div>
  );
}
