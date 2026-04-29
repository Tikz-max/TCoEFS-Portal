"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import type { DocumentType } from "@/types/database.types";

type ChecklistItem = {
  type: DocumentType;
  label: string;
  uploaded: boolean;
  filePath: string | null;
};

type AppPayload = {
  snapshot: {
    applicationPublicId: string;
    programmeLabel: string;
    uploadedDocuments: number;
    requiredDocuments: number;
  };
  checklist: {
    items: ChecklistItem[];
    uploadedCount: number;
    requiredCount: number;
    complete: boolean;
  };
};

export default function ApplicantDocumentsPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<AppPayload | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDocumentType, setUploadingDocumentType] =
    useState<DocumentType | null>(null);
  const documentInputRefs = useRef<
    Partial<Record<DocumentType, HTMLInputElement | null>>
  >({});

  async function load() {
    const res = await fetch("/api/applicant/application", { method: "GET" });
    const body = await res.json();
    if (!res.ok || !body?.success) {
      throw new Error(body?.error || "Could not load documents.");
    }
    setPayload(body.data as AppPayload);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (error) {
        setIssues([
          error instanceof Error
            ? error.message
            : "Unable to load documents right now.",
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function uploadDocumentForType(documentType: DocumentType, file: File) {
    setUploadingDocumentType(documentType);
    setIssues([]);

    try {
      const formData = new FormData();
      formData.set("documentType", documentType);
      formData.set("file", file);

      const res = await fetch("/api/applicant/documents/upload", {
        method: "POST",
        body: formData,
      });

      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.error || "Unable to upload document.");
      }

      setPayload((prev) => {
        if (!prev) return prev;
        const filePath = body.data?.filePath as string | undefined;
        const nextItems = prev.checklist.items.map((item) =>
          item.type === documentType
            ? { ...item, uploaded: true, filePath: filePath || item.filePath }
            : item
        );
        const uploadedCount = nextItems.filter((item) => item.uploaded).length;
        return {
          ...prev,
          snapshot: {
            ...prev.snapshot,
            uploadedDocuments: uploadedCount,
          },
          checklist: {
            ...prev.checklist,
            items: nextItems,
            uploadedCount,
            complete: uploadedCount >= prev.checklist.requiredCount,
          },
        };
      });

      void load();
    } catch (error) {
      setIssues([
        error instanceof Error
          ? error.message
          : "Unable to upload document right now.",
      ]);
    } finally {
      setUploadingDocumentType(null);
    }
  }

  if (loading && !payload) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading documents...
      </div>
    );
  }

  if (!payload) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Could not load documents.
      </div>
    );
  }

  const { snapshot, checklist } = payload;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-surface-dark)", padding: "24px 18px 40px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "var(--bg-surface-default)", borderRadius: 12, boxShadow: "var(--elevation-2)", padding: 20 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Applicant Documents</div>
          <div style={{ marginTop: 6, fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
            Upload Required Files
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {snapshot.applicationPublicId} · {snapshot.programmeLabel} · {snapshot.uploadedDocuments}/{snapshot.requiredDocuments} uploaded
          </div>
        </div>

        <div style={{ background: "var(--bg-surface-default)", borderRadius: 12, boxShadow: "var(--elevation-2)", padding: 18, display: "grid", gap: 8 }}>
          {checklist.items.map((item) => (
            <div
              key={item.type}
              style={{
                borderRadius: 8,
                border: "1px solid var(--border-subtle)",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{item.label}</div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => documentInputRefs.current[item.type]?.click()}
                  disabled={Boolean(uploadingDocumentType)}
                  style={{
                    height: 32,
                    borderRadius: 7,
                    border: "1px solid var(--border-default)",
                    background: "var(--bg-surface-default)",
                    color: "var(--text-primary)",
                    padding: "0 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: uploadingDocumentType ? "not-allowed" : "pointer",
                    opacity: uploadingDocumentType ? 0.6 : 1,
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Upload size={13} />
                  {uploadingDocumentType === item.type ? "Uploading..." : item.uploaded ? "Replace" : "Upload"}
                </button>

                <input
                  ref={(node) => {
                    documentInputRefs.current[item.type] = node;
                  }}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    void uploadDocumentForType(item.type, file);
                  }}
                  style={{ display: "none" }}
                />

                <div
                  style={{
                    fontSize: 12,
                    color: item.uploaded
                      ? "var(--status-success-text)"
                      : "var(--status-warning-text)",
                    background: item.uploaded
                      ? "var(--status-success-bg)"
                      : "var(--status-warning-bg)",
                    borderRadius: 999,
                    padding: "3px 8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {item.uploaded ? <CheckCircle2 size={12} /> : null}
                  {item.uploaded ? "Uploaded" : "Missing"}
                </div>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <button
              onClick={() => router.push("/applicant/dashboard")}
              style={{ background: "none", border: "none", display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <ChevronLeft size={14} /> Back to Dashboard
            </button>
            <button
              onClick={() => router.push("/applicant/dashboard")}
              style={{
                height: 40,
                borderRadius: 8,
                border: "none",
                padding: "0 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "linear-gradient(135deg, var(--green-medium) 0%, var(--green-primary) 100%)",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Back to Dashboard <ChevronRight size={14} />
            </button>
          </div>

          {issues.length > 0 ? (
            <div
              style={{
                marginTop: 6,
                color: "var(--status-error-text)",
                background: "var(--status-error-bg)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12,
              }}
            >
              {issues.map((issue) => (
                <div key={issue}>{issue}</div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
