"use client";

import React, { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   POST /api/admin/training
   - Purpose: Create new training programme
   - Body: { 
       title: string, 
       description: string, 
       category: string, 
       start_date: string (YYYY-MM-DD),
       end_date: string (YYYY-MM-DD),
       venue: string, 
       capacity: number, 
       fee: number
     }
   - Response: { success: boolean, training: Training }
   - Auth: Training Coordinator or Super Admin
   - Note: Creator is automatically assigned as coordinator
   - Note: Training starts as "draft" status
   
   GET /api/admin/training/categories
   - Purpose: Fetch available training categories
   - Response: { categories: string[] }
   - Auth: Training Coordinator or Super Admin
   ============================================================================ */

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
  status: "draft" | "published" | "registration_closed" | "in_progress" | "completed" | "cancelled" | "pending_publish";
  coordinator: string;
  coordinatorId: string;
}

interface TrainingNewDrawerProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  onClose: () => void;
  onCreate: (newTraining: Partial<Training>) => void;
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
  infoBg: "#DBEAFE",
  infoText: "#1E40AF",
  warningBg: "#FEF3C7",
  warningText: "#92400E",
  errorBg: "#FEE2E2",
  errorText: "#991B1B",
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

export function TrainingNewDrawer({ currentUser, onClose, onCreate }: TrainingNewDrawerProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    fee: "",
    venue: "",
    capacity: "",
    startDate: "",
    endDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.fee || Number(formData.fee) < 0) newErrors.fee = "Valid fee is required";
    if (!formData.venue.trim()) newErrors.venue = "Venue is required";
    if (!formData.capacity || Number(formData.capacity) < 1) newErrors.capacity = "Capacity must be at least 1";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const newTraining: Partial<Training> = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      fee: `₦${Number(formData.fee).toLocaleString()}`,
      venue: formData.venue,
      capacity: Number(formData.capacity),
      coordinator: currentUser.name,
      coordinatorId: currentUser.id,
      status: "draft",
      registered: 0,
    };

    onCreate(newTraining);
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
          width: 520,
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${C.medium}, ${C.primary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.white,
              }}
            >
              <Plus size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
                New Training Programme
              </h2>
              <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>
                You will be assigned as the coordinator
              </p>
            </div>
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

        {/* Info Banner */}
        <div
          style={{
            margin: "16px 24px 0",
            padding: "12px 16px",
            background: C.infoBg,
            borderRadius: 8,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <AlertCircle size={16} color={C.infoText} style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: C.infoText, margin: 0, lineHeight: 1.5 }}>
            New training programmes are created as <strong>Draft</strong>. 
            Once ready, request Super Admin to publish it for you.
          </p>
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
                placeholder="e.g., Climate-Smart Agriculture Workshop"
                style={{
                  height: 40,
                  padding: "0 12px",
                  border: `1px solid ${errors.title ? C.errorText : C.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  color: C.text,
                  outline: "none",
                  width: "100%",
                }}
              />
              {errors.title && (
                <p style={{ fontSize: 11, color: C.errorText, marginTop: 4 }}>{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the training programme..."
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
                  style={{
                    height: 40,
                    padding: "0 12px",
                    border: `1px solid ${errors.category ? C.errorText : C.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    color: formData.category ? C.text : C.textMuted,
                    outline: "none",
                    width: "100%",
                    cursor: "pointer",
                    background: C.white,
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && (
                  <p style={{ fontSize: 11, color: C.errorText, marginTop: 4 }}>{errors.category}</p>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  Fee (₦) *
                </label>
                <input
                  type="number"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  placeholder="50000"
                  min="0"
                  style={{
                    height: 40,
                    padding: "0 12px",
                    border: `1px solid ${errors.fee ? C.errorText : C.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    color: C.text,
                    outline: "none",
                    width: "100%",
                  }}
                />
                {errors.fee && (
                  <p style={{ fontSize: 11, color: C.errorText, marginTop: 4 }}>{errors.fee}</p>
                )}
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
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{
                    height: 40,
                    padding: "0 12px",
                    border: `1px solid ${errors.startDate ? C.errorText : C.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    color: C.text,
                    outline: "none",
                    width: "100%",
                  }}
                />
                {errors.startDate && (
                  <p style={{ fontSize: 11, color: C.errorText, marginTop: 4 }}>{errors.startDate}</p>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{
                    height: 40,
                    padding: "0 12px",
                    border: `1px solid ${errors.endDate ? C.errorText : C.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    color: C.text,
                    outline: "none",
                    width: "100%",
                  }}
                />
                {errors.endDate && (
                  <p style={{ fontSize: 11, color: C.errorText, marginTop: 4 }}>{errors.endDate}</p>
                )}
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
                placeholder="e.g., TCoEFS Training Hall, Fed Polytechnic B/K"
                style={{
                  height: 40,
                  padding: "0 12px",
                  border: `1px solid ${errors.venue ? C.errorText : C.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  color: C.text,
                  outline: "none",
                  width: "100%",
                }}
              />
              {errors.venue && (
                <p style={{ fontSize: 11, color: C.errorText, marginTop: 4 }}>{errors.venue}</p>
              )}
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
                placeholder="50"
                min="1"
                style={{
                  height: 40,
                  padding: "0 12px",
                  border: `1px solid ${errors.capacity ? C.errorText : C.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  color: C.text,
                  outline: "none",
                  width: "100%",
                }}
              />
              {errors.capacity && (
                <p style={{ fontSize: 11, color: C.errorText, marginTop: 4 }}>{errors.capacity}</p>
              )}
            </div>

            {/* Coordinator Info (read-only) */}
            <div
              style={{
                padding: "12px 16px",
                background: C.canvas,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.medium}, ${C.primary})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.white,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {currentUser.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>You will be the coordinator</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{currentUser.name}</p>
              </div>
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
              flex: 1,
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
            Create Training
          </button>
        </div>
      </div>
    </>
  );
}
