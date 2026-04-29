"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  User,
  Mail,
  GraduationCap,
} from "lucide-react";

type ApplicationItem = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  programmeTitle: string;
  programmeSlug: string;
  status: "pending" | "review" | "approved" | "rejected";
  submittedAt: string | null;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; fg: string; bg: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    fg: "var(--status-warning-text)",
    bg: "var(--status-warning-bg)",
    icon: Clock,
  },
  review: {
    label: "Under review",
    fg: "var(--text-primary)",
    bg: "var(--bg-surface-light)",
    icon: FileText,
  },
  approved: {
    label: "Approved",
    fg: "var(--status-success-text)",
    bg: "var(--status-success-bg)",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    fg: "var(--status-error-text)",
    bg: "var(--status-error-bg)",
    icon: XCircle,
  },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminApplicationsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/applications?${params.toString()}`, {
        cache: "no-store",
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Failed to load applications.");
      }
      setApplications(body.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [statusFilter]);

  return (
    <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
      <section
        style={{
          background: "var(--bg-surface-default)",
          boxShadow: "var(--elevation-2)",
          borderRadius: 20,
          padding: 22,
        }}
      >
        <div
          style={{
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
          }}
        >
          Admissions workspace
        </div>
        <h1
          style={{ margin: "8px 0 0", fontSize: 30, color: "var(--text-primary)" }}
        >
          Postgraduate applications
        </h1>
        <p
          style={{
            margin: "10px 0 0",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            maxWidth: 760,
          }}
        >
          Review applications, verify documents, and approve or reject admissions.
        </p>
      </section>

      <section
        style={{
          background: "var(--bg-surface-default)",
          boxShadow: "var(--elevation-2)",
          borderRadius: 20,
          padding: 20,
          display: "grid",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-surface-light)",
              boxShadow: "var(--shadow-inset)",
              borderRadius: 10,
              padding: "8px 12px",
              flex: 1,
              minWidth: 200,
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void load();
              }}
              placeholder="Search by programme..."
              style={{
                border: "none",
                background: "transparent",
                flex: 1,
                fontSize: 14,
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={`/admin/applications?status=${opt.value}`}
                style={{
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  background:
                    statusFilter === opt.value
                      ? "var(--green-primary)"
                      : "var(--bg-surface-light)",
                  color:
                    statusFilter === opt.value ? "#fff" : "var(--text-secondary)",
                }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ color: "var(--text-secondary)", padding: 20 }}>
            Loading applications...
          </div>
        ) : error ? (
          <div style={{ color: "var(--status-error-text)", padding: 20 }}>{error}</div>
        ) : applications.length === 0 ? (
          <div
            style={{
              color: "var(--text-secondary)",
              padding: 40,
              textAlign: "center",
            }}
          >
            No applications found.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {applications.map((app) => {
              const status = STATUS_CONFIG[app.status];
              const StatusIcon = status.icon;
              return (
                <Link
                  key={app.id}
                  href={`/admin/applications/${app.id}`}
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    background: "var(--bg-surface-light)",
                    borderRadius: 14,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <User size={14} color="var(--text-muted)" />
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {app.applicantName}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "var(--text-secondary)",
                      }}
                    >
                      <Mail size={12} />
                      {app.applicantEmail}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "var(--text-secondary)",
                      }}
                    >
                      <GraduationCap size={12} />
                      {app.programmeTitle}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: status.bg,
                        color: status.fg,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <StatusIcon size={12} />
                      {status.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                      }}
                    >
                      {app.submittedAt
                        ? `Submitted ${formatDate(app.submittedAt)}`
                        : `Created ${formatDate(app.createdAt)}`}
                    </div>
                  </div>

                  <ChevronRight
                    size={18}
                    color="var(--text-muted)"
                    style={{ marginLeft: "auto" }}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}