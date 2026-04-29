"use client";

import React, { useState } from "react";
import {
  X,
  BookOpen,
  Tag,
  UserCheck,
  Users,
  FileText,
  Download,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  FileQuestion,
  CheckCircle2,
} from "lucide-react";
import { ConfirmationModal } from "@/components/ui/modals/ConfirmationModal";
import type { Course, Participant, Module } from "@/types/elearning.types";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   GET /api/admin/elearning/courses/:id
   - Purpose: Fetch single course details with modules and participants
   - Response: { course: Course, participants: Participant[] }
   - Auth: Training Coordinator or Super Admin
   
   POST /api/admin/elearning/courses/:id/request-publish
   - Purpose: Coordinator requests Super Admin to publish course
   - Response: { success: boolean, course: Course }
   - Side effects: Sends notification to Super Admin
   - Auth: Training Coordinator (own courses only)
   
   POST /api/admin/elearning/courses/:id/publish
   - Purpose: Publish course (open enrollment)
   - Response: { success: boolean, course: Course }
   - Side effects: Makes course visible to participants
   - Auth: Super Admin only
   
   POST /api/admin/elearning/courses/:id/cancel
   - Purpose: Archive/cancel course
   - Body: { reason?: string }
   - Response: { success: boolean, course: Course }
   - Auth: Super Admin only
   
   POST /api/admin/elearning/courses/:id/participants/export
   - Purpose: Export participants as CSV
   - Response: CSV file download
   - Auth: Training Coordinator or Super Admin
   ============================================================================ */

type UserRole = "training_coordinator" | "super_admin";

interface CourseDetailDrawerProps {
  course: Course;
  participants: Participant[];
  userRole: UserRole;
  onClose: () => void;
  onEdit: () => void;
  onRequestPublish?: () => void;
  onPublish?: () => void;
  onCancel?: () => void;
}

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
  drawer: "inset 0 4px 0 rgba(255,255,255,0.85), 0 20px 40px rgba(45,90,45,0.2), 0 40px 60px rgba(45,90,45,0.1)",
};

const getStatusStyle = (status: Course["status"]) => {
  const styles: Record<Course["status"], { bg: string; color: string }> = {
    draft: { bg: C.canvas, color: C.textSec },
    pending_publish: { bg: C.infoBg, color: C.infoText },
    published: { bg: C.successBg, color: C.successText },
    archived: { bg: "#F3F4F6", color: "#6B7280" },
  };
  return styles[status];
};

const getStatusLabel = (status: Course["status"]) => {
  const labels: Record<Course["status"], string> = {
    draft: "Draft",
    pending_publish: "Pending Publish",
    published: "Published",
    archived: "Archived",
  };
  return labels[status];
};

export function CourseDetailDrawer({
  course,
  participants,
  userRole,
  onClose,
  onEdit,
  onRequestPublish,
  onPublish,
  onCancel,
}: CourseDetailDrawerProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);

  const statusStyle = getStatusStyle(course.status);

  const canRequestPublish = userRole === "training_coordinator" && course.status === "draft";
  const canPublish = userRole === "super_admin" && (course.status === "draft" || course.status === "pending_publish");
  const canCancel = userRole === "super_admin" && course.status === "published";

  const handleCancelConfirm = () => {
    if (onCancel) {
      onCancel();
    }
    setShowCancelModal(false);
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
          width: 640,
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
              {course.id}
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>
              {course.title}
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
              {getStatusLabel(course.status)}
            </span>
          </div>

          {/* Info Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                <Tag size={12} style={{ display: "inline", marginRight: 4 }} />
                Category
              </label>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 500, margin: 0 }}>
                {course.category}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                <UserCheck size={12} style={{ display: "inline", marginRight: 4 }} />
                Coordinator
              </label>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 500, margin: 0 }}>
                {course.coordinatorName}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                <BookOpen size={12} style={{ display: "inline", marginRight: 4 }} />
                Modules
              </label>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 700, margin: 0 }}>
                {course.modules.length}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                <Users size={12} style={{ display: "inline", marginRight: 4 }} />
                Participants
              </label>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 700, margin: 0 }}>
                {course.enrolledCount} enrolled
              </p>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>
                <FileText size={12} style={{ display: "inline", marginRight: 4 }} />
                Pass Threshold
              </label>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 700, margin: 0 }}>
                {course.passThreshold}%
              </p>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>
              Description
            </label>
            <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6, margin: 0 }}>
              {course.description}
            </p>
          </div>

          {/* Modules List */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 12 }}>
              <BookOpen size={12} style={{ display: "inline", marginRight: 4 }} />
              Modules ({course.modules.length})
            </label>
            <div style={{ background: C.canvas, borderRadius: 8, overflow: "hidden" }}>
              {course.modules.map((mod, i) => (
                <div
                  key={mod.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: i < course.modules.length - 1 ? `1px solid ${C.borderSubtle}` : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>
                      Module {mod.number}: {mod.title}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      {mod.quiz && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.infoText }}>
                          <FileQuestion size={11} /> Quiz
                        </span>
                      )}
                      {mod.assignment && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.warningText }}>
                          <FileText size={11} /> Assignment
                        </span>
                      )}
                      {mod.duration && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textMuted }}>
                          <Clock size={11} /> {mod.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Participants */}
          {participants.length > 0 ? (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 12 }}>
                <Users size={12} style={{ display: "inline", marginRight: 4 }} />
                Participants ({participants.length})
              </label>
              <div style={{ background: C.canvas, borderRadius: 8, overflow: "hidden" }}>
                {participants.map((participant, i) => (
                  <div
                    key={participant.id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: i < participants.length - 1 ? `1px solid ${C.borderSubtle}` : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{participant.userName}</p>
                      <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{participant.userEmail}</p>
                    </div>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 8,
                        background: participant.status === "completed" ? C.successBg : C.whisper,
                        color: participant.status === "completed" ? C.successText : C.textSec,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {participant.status === "completed" ? "Completed" : participant.status === "in_progress" ? "In Progress" : "Enrolled"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 32, background: C.canvas, borderRadius: 8 }}>
              <Users size={32} color={C.textMuted} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 14, color: C.textSec, margin: 0 }}>No participants enrolled yet</p>
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
            Export Participants
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
              Archive
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
              Edit Course
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        open={showCancelModal}
        title="Archive Course"
        message={`Are you sure you want to archive "${course.title}"? This will hide it from participants.`}
        iconType="warning"
        confirmLabel="Archive Course"
        cancelLabel="Keep Published"
        destructive
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancelModal(false)}
      />
    </>
  );
}
