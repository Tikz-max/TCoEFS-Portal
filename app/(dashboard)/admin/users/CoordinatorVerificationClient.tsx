"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import type { PendingCoordinator } from "@/features/admin";

export function CoordinatorVerificationClient({
  initialCoordinators,
}: {
  initialCoordinators: PendingCoordinator[];
}) {
  const [items, setItems] = useState(initialCoordinators);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage(null);
    const response = await fetch("/api/admin/coordinators/pending", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.success) {
      setError(result.error || "Failed to load pending coordinators.");
      setLoading(false);
      return;
    }
    setItems(result.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    setItems(initialCoordinators);
  }, [initialCoordinators]);

  const approve = async (userId: string) => {
    setActionLoading(userId);
    setError("");
    setMessage(null);
    const response = await fetch(`/api/admin/coordinators/${userId}/verify`, { method: "POST" });
    const result = await response.json();
    if (!response.ok || !result.success) {
      setError(result.error || "Failed to approve coordinator.");
      setActionLoading(null);
      return;
    }
    setItems((current) => current.filter((entry) => entry.userId !== userId));
    setMessage("Coordinator approved successfully.");
    setActionLoading(null);
  };

  return (
    <div style={{ display: "grid", gap: 18, padding: "24px 24px 40px" }}>
      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 22 }}>
        <Link href="/admin/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--green-primary)", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: 12 }}>
          Admin workspace
        </div>
        <h1 style={{ margin: "8px 0 0", fontSize: 30, color: "var(--text-primary)" }}>
          Coordinator verification
        </h1>
        <p style={{ margin: "10px 0 0", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 760 }}>
          Approve training and e-learning coordinators before they can sign in.
        </p>
      </section>

      <section style={{ background: "var(--bg-surface-default)", boxShadow: "var(--elevation-2)", borderRadius: 20, padding: 20, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            Pending coordinators ({items.length})
          </div>
          <button onClick={loadPending} style={{ border: "none", boxShadow: "var(--elevation-1)", background: "var(--bg-surface-light)", borderRadius: 10, height: 36, padding: "0 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {error && (
          <div style={{ color: "var(--status-error-text)", background: "var(--status-error-bg)", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>{error}</div>
        )}
        {message && (
          <div style={{ color: "var(--status-success-text)", background: "var(--status-success-bg)", borderRadius: 10, padding: "10px 12px", fontSize: 13 }}>{message}</div>
        )}

        {loading ? (
          <div style={{ color: "var(--text-secondary)", padding: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={15} /> Loading pending coordinators...
          </div>
        ) : items.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", padding: 40, textAlign: "center" }}>
            No coordinators pending verification.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((item) => (
              <div key={item.userId} style={{ background: "var(--bg-surface-light)", boxShadow: "var(--elevation-1)", borderRadius: 14, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{item.fullName}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{item.email}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    {item.role === "training_coordinator" ? "Training Coordinator" : "E-Learning Coordinator"}
                  </div>
                </div>
                <button
                  onClick={() => approve(item.userId)}
                  disabled={actionLoading === item.userId}
                  style={{ border: "none", background: "var(--status-success-bg)", color: "var(--status-success-text)", borderRadius: 10, padding: "8px 16px", fontWeight: 700, cursor: actionLoading === item.userId ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
                >
                  {actionLoading === item.userId ? <Loader2 size={14} /> : <CheckCircle2 size={14} />}
                  {actionLoading === item.userId ? "Approving..." : "Approve"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
