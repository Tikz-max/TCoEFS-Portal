"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  UserCheck,
  Users,
  FileText,
  Download,
  Edit,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ConfirmationModal } from "@/components/ui/modals/ConfirmationModal";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   GET /api/admin/training/:id
   - Purpose: Fetch single training details with registrations
   - Response: { training: TrainingDetail, registrations: Registration[] }
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
   
   POST /api/admin/training/:id/cancel
   - Purpose: Cancel training programme
   - Body: { reason: string }
   - Response: { success: boolean, training: Training }
   - Side effects: Sends notification to registered participants
   - Auth: Super Admin only
   
   POST /api/admin/training/:id/registrations/export
   - Purpose: Export registered participants as CSV
   - Response: CSV file download
   - Auth: Training Coordinator or Super Admin
   ============================================================================ */

type UserRole = "training_coordinator" | "super_admin";

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: "registered" | "attended" | "cancelled";
}

interface TrainingDetail {
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
  registrations: Registration[];
}

interface TrainingDetailDrawerProps {
  training: TrainingDetail;
  userRole: UserRole;
  onClose: () => void;
  onEdit: () => void;
  onPublish?: () => void;
  onRequestPublish?: () => void;
  onCancel?: () => void;
}

/* ============================================================================
   DESIGN TOKENS (Matching admin theme)
   ============================================================================ */
const C = {
  primary: "#2D5A2D",
  medium: "#3D7A3D",
  whisper: "#E8F5E8",
  canvas: "#EFF3EF",
  white: "#FFFFFF",
  text: "#111B11",
  textSec: "#526052",
  textMuted: "#8A9E8A",
  border: "#D8E4D8",
  borderSubtle: "#EBF0EB",
  warningBg: "#FEF3C7",
  warningText: "#92400E",
  infoBg: "#DBEAFE",
  infoText: "#1E40AF",
  successBg: "#DCFCE7",
  successText: "#166534",
};

const shadow = {
  drawer:
    "inset 0 4px 0 rgba(255,255,255,0.85), 0 20px 40px rgba(45,90,45,0.2), 0 40px 60px rgba(45,90,45,0.1)",
};

export function TrainingDetailDrawer({
  training,
  userRole,
  onClose,
  onEdit,
  onPublish,
  onRequestPublish,
  onCancel,
}: TrainingDetailDrawerProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const getStatusStyle = (status: TrainingDetail["status"]) => {
    const styles: Record<TrainingDetail["status"], { bg: string; color: string }> = {
      draft: { bg: C.canvas, color: C.textSec },
      pending_publish: { bg: C.infoBg, color: C.infoText },
      published: { bg: C.successBg, color: C.successText },
      registration_closed: { bg: C.warningBg, color: C.warningText },
      in_progress: { bg: C.infoBg, color: C.infoText },
      completed: { bg: C.whisper, color: C.primary },
      cancelled: { bg: "#FEE2E2", color: "#991B1B" },
    };
    return styles[status];
  };

  const getStatusLabel = (status: TrainingDetail["status"]) => {
    const labels: Record<TrainingDetail["status"], string> = {
      draft: "Draft",
      pending_publish: "Pending Publish",
      published: "Published",
      registration_closed: "Registration Closed",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status];
  };

  const statusStyle = getStatusStyle(training.status);

  const canRequestPublish = userRole === "training_coordinator" && training.status === "draft";
  const canPublish = userRole === "super_admin" && (training.status === "draft" || training.status === "pending_publish");
  const canCancel = userRole === "super_admin" && (training.status === "published" || training.status === "in_progress");

  const handleCancelConfirm = () => {
    if (onCancel) {
      onCancel();
    }
    setShowCancelModal(false);
    setCancelReason("");
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
          width: 600,
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
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: C.textMuted,
                display: "block",
                marginBottom: 4,
              }}
            >
              {training.id}
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>
              {training.title}
            </h2>
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

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {/* Status Badge */}
          <div style={{ marginBottom: 24 }}>
            <span
              style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: 16,
                background: statusStyle.bg,
                color: statusStyle.color,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {getStatusLabel(training.status)}
            </span>
          </div>

          {/* Info Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                <Calendar size={12} style={{ display: "inline", marginRight: 4 }} />
                Schedule
              </label>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 500, margin: 0 }}>
                {training.startDate} - {training.endDate}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                <MapPin size={12} style={{ display: "inline", marginRight: 4 }} />
                Venue
              </label>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 500, margin: 0 }}>
                {training.venue}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                <Tag size={12} style={{ display: "inline", marginRight: 4 }} />
                Category
              </label>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 500, margin: 0 }}>
                {training.category}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                <DollarSign size={12} style={{ display: "inline", marginRight: 4 }} />
                Fee
              </label>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 700, margin: 0 }}>
                {training.fee}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                <UserCheck size={12} style={{ display: "inline", marginRight: 4 }} />
                Coordinator
              </label>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 500, margin: 0 }}>
                {training.coordinator}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                <Users size={12} style={{ display: "inline", marginRight: 4 }} />
                Registrations
              </label>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 700, margin: 0 }}>
                {training.registered} / {training.capacity}
              </p>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>
              <FileText size={12} style={{ display: "inline", marginRight: 4 }} />
              Description
            </label>
            <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6, margin: 0 }}>
              {training.description}
            </p>
          </div>

          {/* Registered Participants */}
          {training.registrations.length > 0 ? (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 12 }}>
                <Users size={12} style={{ display: "inline", marginRight: 4 }} />
                Registered Participants ({training.registrations.length})
              </label>
              <div style={{ background: C.canvas, borderRadius: 8, overflow: "hidden" }}>
                {training.registrations.map((reg, i) => (
                  <div
                    key={reg.id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: i < training.registrations.length - 1 ? `1px solid ${C.borderSubtle}` : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{reg.name}</p>
                      <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{reg.email}</p>
                    </div>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 8,
                        background: reg.status === "attended" ? C.successBg : C.whisper,
                        color: reg.status === "attended" ? C.successText : C.textSec,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {reg.status === "attended" ? "Attended" : "Registered"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 32, background: C.canvas, borderRadius: 8 }}>
              <Users size={32} color={C.textMuted} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 14, color: C.textSec, margin: 0 }}>No registrations yet</p>
            </div>
          )}
        </div>

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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Download size={14} />
            Export Registrations
          </button>
          
          {/* Role-based action buttons */}
          {canRequestPublish && (
            <button
              onClick={onRequestPublish}
              style={{
                flex: 1,
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
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Send size={14} />
              Request Publish
            </button>
          )}
          
          {canPublish && (
            <button
              onClick={onPublish}
              style={{
                flex: 1,
                height: 40,
                padding: "0 16px",
                borderRadius: 6,
                border: "none",
                background: C.successText,
                color: C.white,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <CheckCircle size={14} />
              Publish
            </button>
          )}
          
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                flex: 1,
                height: 40,
                padding: "0 16px",
                borderRadius: 6,
                border: "none",
                background: "#991B1B",
                color: C.white,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <XCircle size={14} />
              Cancel Training
            </button>
          )}
          
          {!canRequestPublish && !canPublish && !canCancel && (
            <button
              onClick={onEdit}
              style={{
                flex: 1,
                height: 40,
                padding: "0 16px",
                borderRadius: 6,
                border: "none",
                background: C.primary,
                color: C.white,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Edit size={14} />
              Edit Training
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        open={showCancelModal}
        title="Cancel Training"
        message={`Are you sure you want to cancel "${training.title}"? This will notify all ${training.registered} registered participants.`}
        iconType="danger"
        confirmLabel="Cancel Training"
        cancelLabel="Keep Training"
        destructive
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancelModal(false)}
      />
    </>
  );
}
