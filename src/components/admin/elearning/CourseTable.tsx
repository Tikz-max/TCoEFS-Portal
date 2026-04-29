"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Users,
} from "lucide-react";
import type { Course, CourseFilters } from "@/types/elearning.types";

/* ============================================================================
   BACKEND API REQUIREMENTS
   ============================================================================
   
   GET /api/admin/elearning/courses
   - Purpose: Fetch all courses with filtering and pagination
   - Query params: status, category, search, page, limit, coordinator_id
   - Response: { courses: Course[], total: number, page: number, pages: number }
   - Auth: Training Coordinator or Super Admin
   - Note: coordinator_id filter applied server-side based on user role
   
   GET /api/admin/elearning/courses/:id
   - Purpose: Fetch single course with modules and participants
   - Response: { course: Course, participants: Participant[] }
   - Auth: Training Coordinator or Super Admin
   
   POST /api/admin/elearning/courses/:id/participants/export
   - Purpose: Export course participants as CSV
   - Response: CSV file download
   - Auth: Training Coordinator or Super Admin
   ============================================================================ */

interface CourseTableProps {
  courses: Course[];
  onView: (course: Course) => void;
  onEdit: (course: Course) => void;
  coordinatorId?: string;
  isSuperAdmin?: boolean;
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
  warningText: "#92400E",
  warningBg: "#FEF3C7",
  infoText: "#1E40AF",
  infoBg: "#DBEAFE",
  successBg: "#DCFCE7",
  successText: "#166534",
};

const shadow = {
  sm: "0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev1: "inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(45,90,45,0.15), 0 2px 4px rgba(45,90,45,0.1)",
  elev2: "inset 0 1px 0 rgba(255,255,255,0.75), 0 4px 8px rgba(45,90,45,0.12), 0 8px 16px rgba(45,90,45,0.08)",
};

const categories = [
  "All Categories",
  "Agriculture",
  "Food Technology",
  "Economics",
  "Business",
  "Environment",
];

const statuses = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_publish", label: "Pending Publish" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

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

export function CourseTable({
  courses,
  onView,
  onEdit,
}: CourseTableProps) {
  const [filters, setFilters] = useState<CourseFilters>({
    search: "",
    status: "all",
    category: "All Categories",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.category !== "All Categories";

  const clearFilters = () => {
    setFilters({ search: "", status: "all", category: "All Categories" });
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      !filters.search ||
      course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      course.id.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus =
      filters.status === "all" || course.status === filters.status;
    const matchesCategory =
      filters.category === "All Categories" ||
      course.category === filters.category;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div style={{ background: C.white, borderRadius: 8, boxShadow: shadow.elev2, border: `1px solid ${C.borderSubtle}` }}>
      {/* Toolbar */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${C.borderSubtle}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", flex: 1, maxWidth: 320 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              color: C.textMuted,
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search course title..."
            style={{
              height: 36,
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

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            height: 36,
            padding: "0 14px",
            borderRadius: 6,
            border: `1px solid ${showFilters ? C.primary : C.border}`,
            background: showFilters ? C.whisper : C.white,
            color: showFilters ? C.primary : C.textSec,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Filter size={14} />
          Filters
          {hasActiveFilters && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: C.primary,
              }}
            />
          )}
        </button>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div
          style={{
            padding: "16px 20px",
            background: C.canvas,
            borderBottom: `1px solid ${C.borderSubtle}`,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {/* Status filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                height: 36,
                padding: "0 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                background: C.white,
                fontSize: 13,
                color: C.text,
                outline: "none",
                width: "100%",
                cursor: "pointer",
              }}
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, display: "block", marginBottom: 6 }}>
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{
                height: 36,
                padding: "0 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                background: C.white,
                fontSize: 13,
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

          {/* Clear filters */}
          {hasActiveFilters && (
            <div style={{ gridColumn: "span 2", display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
              <button
                onClick={clearFilters}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 4,
                  border: "none",
                  background: "transparent",
                  color: C.primary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <RefreshCw size={12} />
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.canvas }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>
                Course
              </th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>
                Category
              </th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>
                Modules
              </th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>
                Participants
              </th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted }}>
                Status
              </th>
              <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color: C.textMuted, width: 160 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((course) => {
              const statusStyle = getStatusStyle(course.status);
              return (
                <tr
                  key={course.id}
                  style={{
                    borderTop: `1px solid ${C.borderSubtle}`,
                    transition: "background 100ms ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.canvas;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          fontWeight: 500,
                          color: C.textMuted,
                          letterSpacing: "0.2px",
                          marginBottom: 2,
                        }}
                      >
                        {course.id}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {course.title}
                      </div>
                      <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>
                        Pass: {course.passThreshold}%
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 12,
                        background: C.whisper,
                        color: C.primary,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {course.category}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <BookOpen size={14} color={C.textMuted} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {course.modules.length}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Users size={14} color={C.textMuted} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {course.enrolledCount}
                      </span>
                      {course.completedCount > 0 && (
                        <span style={{ fontSize: 11, color: C.successText }}>
                          ({course.completedCount} done)
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 12,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {getStatusLabel(course.status)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button
                        onClick={() => onView(course)}
                        style={{
                          height: 32,
                          padding: "0 12px",
                          borderRadius: 6,
                          border: `1px solid ${C.border}`,
                          background: C.white,
                          color: C.textSec,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Eye size={13} />
                        View
                      </button>
                      <button
                        onClick={() => onEdit(course)}
                        style={{
                          height: 32,
                          padding: "0 12px",
                          borderRadius: 6,
                          border: "none",
                          background: C.primary,
                          color: C.white,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Edit size={13} />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filteredCourses.length === 0 && (
        <div style={{ padding: 48, textAlign: "center" }}>
          <BookOpen size={48} color={C.textMuted} style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 14, color: C.textSec, margin: 0 }}>
            {hasActiveFilters ? "No courses match your filters" : "No courses yet"}
          </p>
        </div>
      )}

      {/* Pagination */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: `1px solid ${C.borderSubtle}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 12, color: C.textMuted }}>
          Showing {filteredCourses.length} of {courses.length} courses
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            disabled={currentPage === 1}
            style={{
              height: 32,
              width: 32,
              borderRadius: 4,
              border: `1px solid ${C.border}`,
              background: C.white,
              color: currentPage === 1 ? C.textMuted : C.textSec,
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text, padding: "0 12px" }}>
            Page {currentPage}
          </span>
          <button
            disabled={currentPage >= Math.ceil(courses.length / 10)}
            style={{
              height: 32,
              width: 32,
              borderRadius: 4,
              border: `1px solid ${C.border}`,
              background: C.white,
              color: currentPage >= Math.ceil(courses.length / 10) ? C.textMuted : C.textSec,
              cursor: currentPage >= Math.ceil(courses.length / 10) ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: currentPage >= Math.ceil(courses.length / 10) ? 0.5 : 1,
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
