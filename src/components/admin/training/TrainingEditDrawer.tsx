"use client";

import React, { useState } from "react";
import { X, Send } from "lucide-react";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   PATCH /api/admin/training/:id
   - Purpose: Update training programme details
   - Body: { title?, description?, category?, start_date?, end_date?, venue?, capacity?, fee? }
   - Response: { success: boolean, training: Training }
   - Auth: Training Coordinator or Super Admin
   
   POST /api/admin/training/:id/request-publish
   - Purpose: Coordinator requests Super Admin to publish training
   - Response: { success: boolean, training: Training }
   - Side effects: Sends notification to Super Admin
   - Auth: Training Coordinator (own trainings only)
   - Note: Only available when training status is "draft"
   
   POST /api/admin/training/:id/publish
   - Purpose: Publish training (open registration)
   - Response: { success: boolean, training: Training }
   - Side effects: Triggers notification to subscribers
   - Auth: Super Admin only
   
   POST /api/admin/training/:id/close-registration
   - Purpose: Close registration for training
   - Body: { reason?: string }
   - Response: { success: boolean, training: Training }
   - Auth: Training Coordinator or Super Admin
   ============================================================================ */

type UserRole = "training_coordinator" | "super_admin";

interface Training {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  venue: string;
  capacity: number;
  registered: number;
  fee: string;
  status: "draft" | "pending_publish" | "published" | "registration_closed" | "in_progress" | "completed" | "cancelled";
  coordinator: string;
}

interface TrainingEditDrawerProps {
  training: Training;
  userRole: UserRole;
  onClose: () => void;
  onSave: (updatedTraining: Partial<Training>) => void;
  onRequestPublish?: () => void;
}

const C = {
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
};

const shadow = {
  drawer:
    "inset 0 4px 0 rgba(255,255,255,0.85), 0 20px 40px rgba(45,90,45,0.2), 0 40px 60px rgba(45,90,45,0.1)",
};

const categories = [
  "Agriculture",
  "Food Technology",
  "Economics",
  "Business",
  "Environment",
];

export function TrainingEditDrawer({
  training,
  userRole,
  onClose,
  onSave,
  onRequestPublish,
}: TrainingEditDrawerProps) {
  const [formData, setFormData] = useState({
    title: training.title,
    description: training.description,
    category: training.category,
    fee: training.fee.replace("₦", "").replace(",", ""),
    venue: training.venue,
    capacity: training.capacity.toString(),
  });

  const canRequestPublish = userRole === "training_coordinator" && training.status === "draft";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      fee: `₦${Number(formData.fee).toLocaleString()}`,
      venue: formData.venue,
      capacity: Number(formData.capacity),
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 999,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 500,
          background: C.white,
          boxShadow: shadow.drawer,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${C.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: C.canvas,
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
              Edit Training
            </h2>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: C.textMuted,
              }}
            >
              {training.id}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.white,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color={C.textSec} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflow: "auto", padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Title */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                Training Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                style={{
                  height: 40,
                  padding: "0 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  color: C.text,
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{
                  padding: "10px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  color: C.text,
                  outline: "none",
                  width: "100%",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Category & Fee */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  style={{
                    height: 40,
                    padding: "0 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    color: C.text,
                    outline: "none",
                    width: "100%",
                    cursor: "pointer",
                  }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  Fee (₦) *
                </label>
                <input
                  type="number"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  required
                  min="0"
                  style={{
                    height: 40,
                    padding: "0 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    color: C.text,
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  style={{
                    height: 40,
                    padding: "0 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    color: C.text,
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  style={{
                    height: 40,
                    padding: "0 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    color: C.text,
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {/* Venue */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                Venue *
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                required
                style={{
                  height: 40,
                  padding: "0 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  color: C.text,
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>

            {/* Capacity */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                Capacity *
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
                min="1"
                style={{
                  height: 40,
                  padding: "0 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  color: C.text,
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>
          </div>
        </form>

        {/* Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.borderSubtle}`,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.white,
              color: C.textSec,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          
          {canRequestPublish && onRequestPublish && (
            <button
              type="button"
              onClick={() => {
                const event = {
                  preventDefault: () => {},
                } as React.FormEvent<HTMLFormElement>;
                handleSubmit(event);
                onRequestPublish();
              }}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 6,
                border: "none",
                background: C.medium,
                color: C.white,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Send size={14} />
              Save & Request Publish
            </button>
          )}
          
          <button
            type="submit"
            onClick={handleSubmit}
            style={{
              flex: 1,
              height: 40,
              padding: "0 16px",
              borderRadius: 6,
              border: "none",
              background: `linear-gradient(180deg, ${C.medium}, ${C.primary})`,
              color: C.white,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
            }}
          >
            {canRequestPublish ? "Save Changes" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}
