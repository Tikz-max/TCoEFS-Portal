"use client";

import React, { useState } from "react";
import {
  Search,
  Activity,
  User,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  Settings,
  LogIn,
  Download,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   GET /api/super-admin/audit
   - Purpose: Fetch complete audit log for all events
   - Query params: event_type, actor, date_from, date_to, page, limit
   - Response: { events: AuditEvent[], total: number, page: number, pages: number }
   - Auth: Super Admin only
   - Note: Returns ALL events across the system (not filtered by user)
   ============================================================================ */

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  eventType: "payment_override" | "user_login" | "status_change" | "settings_update" | "data_export" | "user_management" | "training_publish" | "course_publish";
  object: string;
  objectId?: string;
  details?: string;
  ipAddress: string;
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
  dangerBg: "#FEE2E2",
  dangerText: "#991B1B",
};

const shadow = {
  sm: "0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev1: "inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev2: "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12), 0 8px 16px rgba(45,90,45,0.08)",
};

const mockAuditEvents: AuditEvent[] = [
  {
    id: "AUD-001",
    timestamp: "23 Mar 2026, 14:32:18",
    actor: "Super Admin",
    actorEmail: "admin@tcoefs.org",
    actorRole: "super_admin",
    action: "Payment override",
    eventType: "payment_override",
    object: "PAY-2026-003",
    details: "Changed status from 'failed' to 'successful'. Reason: Webhook failed - payment confirmed via bank statement",
    ipAddress: "192.168.1.100",
  },
  {
    id: "AUD-002",
    timestamp: "23 Mar 2026, 14:28:45",
    actor: "Super Admin",
    actorEmail: "admin@tcoefs.org",
    actorRole: "super_admin",
    action: "Published training",
    eventType: "training_publish",
    object: "TRG-2026-0010",
    details: "Published 'Sustainable Livestock Systems Training'",
    ipAddress: "192.168.1.100",
  },
  {
    id: "AUD-003",
    timestamp: "23 Mar 2026, 12:15:42",
    actor: "Prof. Chukwuma Obi",
    actorEmail: "c.obi@tcoefs.org",
    actorRole: "training_coordinator",
    action: "Requested publish",
    eventType: "status_change",
    object: "TRG-2026-0010",
    details: "Requested publish for 'Sustainable Livestock Systems Training'",
    ipAddress: "197.210.85.123",
  },
  {
    id: "AUD-004",
    timestamp: "23 Mar 2026, 10:45:33",
    actor: "Prof. Chukwuma Obi",
    actorEmail: "c.obi@tcoefs.org",
    actorRole: "training_coordinator",
    action: "Logged in",
    eventType: "user_login",
    object: "User session",
    ipAddress: "197.210.85.123",
  },
  {
    id: "AUD-005",
    timestamp: "23 Mar 2026, 09:30:12",
    actor: "Dr. Fatima Mohammed",
    actorEmail: "f.mohammed@tcoefs.org",
    actorRole: "training_coordinator",
    action: "Created training",
    eventType: "status_change",
    object: "TRG-2026-0016",
    details: "Created 'Farm Business Planning'",
    ipAddress: "197.210.76.89",
  },
  {
    id: "AUD-006",
    timestamp: "22 Mar 2026, 16:22:11",
    actor: "Super Admin",
    actorEmail: "admin@tcoefs.org",
    actorRole: "super_admin",
    action: "Updated settings",
    eventType: "settings_update",
    object: "Application dates",
    details: "Changed application opening date from 01 Apr 2026 to 15 Apr 2026",
    ipAddress: "192.168.1.100",
  },
  {
    id: "AUD-007",
    timestamp: "22 Mar 2026, 14:08:55",
    actor: "Super Admin",
    actorEmail: "admin@tcoefs.org",
    actorRole: "super_admin",
    action: "Payment override",
    eventType: "payment_override",
    object: "PAY-2026-001",
    details: "Changed status from 'pending' to 'successful'. Reason: Payment confirmed via transfer receipt",
    ipAddress: "192.168.1.100",
  },
  {
    id: "AUD-008",
    timestamp: "22 Mar 2026, 11:30:22",
    actor: "Dr. Fatima Mohammed",
    actorEmail: "f.mohammed@tcoefs.org",
    actorRole: "training_coordinator",
    action: "Logged in",
    eventType: "user_login",
    object: "User session",
    ipAddress: "197.210.76.89",
  },
  {
    id: "AUD-009",
    timestamp: "22 Mar 2026, 09:15:33",
    actor: "Super Admin",
    actorEmail: "admin@tcoefs.org",
    actorRole: "super_admin",
    action: "Published course",
    eventType: "course_publish",
    object: "CRS-2026-007",
    details: "Published 'Introduction to Organic Farming'",
    ipAddress: "192.168.1.100",
  },
  {
    id: "AUD-010",
    timestamp: "21 Mar 2026, 15:45:18",
    actor: "Super Admin",
    actorEmail: "admin@tcoefs.org",
    actorRole: "super_admin",
    action: "Approved application",
    eventType: "status_change",
    object: "APP-2026-0156",
    details: "Approved application for Aisha Mohammed",
    ipAddress: "192.168.1.100",
  },
  {
    id: "AUD-011",
    timestamp: "21 Mar 2026, 14:22:44",
    actor: "Super Admin",
    actorEmail: "admin@tcoefs.org",
    actorRole: "super_admin",
    action: "Exported data",
    eventType: "data_export",
    object: "Applications report",
    details: "Exported applications CSV for March 2026",
    ipAddress: "192.168.1.100",
  },
  {
    id: "AUD-012",
    timestamp: "21 Mar 2026, 10:30:00",
    actor: "Super Admin",
    actorEmail: "admin@tcoefs.org",
    actorRole: "super_admin",
    action: "User role updated",
    eventType: "user_management",
    object: "user@example.com",
    details: "Changed role from 'applicant' to 'training_participant'",
    ipAddress: "192.168.1.100",
  },
];

const getEventIcon = (eventType: AuditEvent["eventType"]) => {
  const icons: Record<string, typeof Activity> = {
    payment_override: CreditCard,
    user_login: LogIn,
    status_change: CheckCircle,
    settings_update: Settings,
    data_export: FileText,
    user_management: User,
    training_publish: CheckCircle,
    course_publish: CheckCircle,
  };
  return icons[eventType] || Activity;
};

const getEventColor = (eventType: AuditEvent["eventType"]) => {
  const colors: Record<string, string> = {
    payment_override: C.warningText,
    user_login: C.infoText,
    status_change: C.successText,
    settings_update: C.textSec,
    data_export: C.primary,
    user_management: C.primary,
    training_publish: C.successText,
    course_publish: C.successText,
  };
  return colors[eventType] || C.textSec;
};

const eventTypeOptions = [
  { value: "all", label: "All Events" },
  { value: "payment_override", label: "Payment Override" },
  { value: "user_login", label: "User Login" },
  { value: "status_change", label: "Status Change" },
  { value: "training_publish", label: "Training Publish" },
  { value: "course_publish", label: "Course Publish" },
  { value: "settings_update", label: "Settings Update" },
  { value: "data_export", label: "Data Export" },
  { value: "user_management", label: "User Management" },
];

export default function SuperAdminAuditLogPage() {
  const [events] = useState(mockAuditEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [actorSearch, setActorSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      !searchQuery ||
      event.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.object.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.details && event.details.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = eventTypeFilter === "all" || event.eventType === eventTypeFilter;
    const matchesActor = !actorSearch || event.actor.toLowerCase().includes(actorSearch.toLowerCase());
    return matchesSearch && matchesType && matchesActor;
  });

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: C.canvas }}>
      <Sidebar
        user={{
          name: "Super Admin",
          initials: "SA",
          role: "super_admin",
          roleLabel: "Super Admin",
        }}
        activeItem="audit-log"
        badges={{}}
      />

      <main style={{ flex: 1, padding: "32px 40px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: C.text,
              letterSpacing: "-0.6px",
              marginBottom: 4,
            }}
          >
            Audit Log
          </h1>
          <p style={{ fontSize: 14, color: C.textSec }}>
            Complete system activity log with all administrative actions
          </p>
        </div>

        <div
          style={{
            background: C.white,
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            boxShadow: shadow.elev2,
            border: `1px solid ${C.borderSubtle}`,
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: C.textMuted,
                pointerEvents: "none",
              }}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions, objects, details..."
              style={{
                height: 40,
                paddingLeft: 36,
                paddingRight: 12,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                background: C.canvas,
                fontSize: 13,
                color: C.text,
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          <input
            type="search"
            value={actorSearch}
            onChange={(e) => setActorSearch(e.target.value)}
            placeholder="Filter by actor..."
            style={{
              height: 40,
              padding: "0 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              background: C.canvas,
              fontSize: 13,
              color: C.text,
              outline: "none",
              width: 180,
            }}
          />

          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            style={{
              height: 40,
              padding: "0 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              background: C.white,
              fontSize: 13,
              color: C.text,
              outline: "none",
              cursor: "pointer",
            }}
          >
            {eventTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.white,
              fontSize: 13,
              color: C.textSec,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Download size={14} />
            Export
          </button>
        </div>

        <div
          style={{
            background: C.white,
            borderRadius: 8,
            boxShadow: shadow.elev2,
            border: `1px solid ${C.borderSubtle}`,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.canvas }}>
                  <th style={thStyle}>Timestamp</th>
                  <th style={thStyle}>Actor</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>Object</th>
                  <th style={thStyle}>Details</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => {
                  const EventIcon = getEventIcon(event.eventType);
                  const eventColor = getEventColor(event.eventType);
                  return (
                    <tr
                      key={event.id}
                      style={{
                        borderTop: `1px solid ${C.borderSubtle}`,
                        transition: "background 100ms ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = C.canvas;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textMuted }}>
                          {event.timestamp}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: C.canvas,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <User size={14} color={C.textMuted} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                              {event.actor}
                            </div>
                            <div style={{ fontSize: 11, color: C.textMuted }}>
                              {event.actorRole.replace(/_/g, " ")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            color: eventColor,
                          }}
                        >
                          <EventIcon size={14} color={eventColor} />
                          {event.action}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSec }}>
                          {event.object}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: C.textSec,
                            maxWidth: 300,
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={event.details}
                        >
                          {event.details || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: C.textMuted }}>
                          {event.ipAddress}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredEvents.length === 0 && (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Activity size={48} color={C.textMuted} style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 14, color: C.textSec, margin: 0 }}>
                {searchQuery || eventTypeFilter !== "all" || actorSearch
                  ? "No events match your filters"
                  : "No audit events recorded"}
              </p>
            </div>
          )}

          <div
            style={{
              padding: "12px 16px",
              borderTop: `1px solid ${C.borderSubtle}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: C.canvas,
            }}
          >
            <span style={{ fontSize: 12, color: C.textMuted }}>
              Showing {filteredEvents.length} of {events.length} events
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  fontSize: 12,
                  color: C.textSec,
                  cursor: "pointer",
                }}
              >
                Previous
              </button>
              <button
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  fontSize: 12,
                  color: C.textSec,
                  cursor: "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  color: C.textMuted,
};
