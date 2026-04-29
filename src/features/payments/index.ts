import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  verifyWebhookSignature,
  type RemitaWebhookPayload,
} from "@/lib/payment/remita";
import {
  ALLOWED_RECEIPT_TYPES,
  buildDocumentKey,
  validateUpload,
} from "@/lib/storage/upload";
import { PRIVATE_R2_BUCKET, privateR2Client } from "@/lib/storage/r2";
import { sendEmailWithResend } from "@/lib/email/resend";
import {
  buildPaymentApprovedEmail,
  buildPaymentRejectedEmail,
} from "@/lib/email/payment-templates";
import type { Database } from "@/types/database.types";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
type BankTransferConfigRow =
  Database["public"]["Tables"]["bank_transfer_configs"]["Row"];
type TrainingApplicationRow =
  Database["public"]["Tables"]["training_applications"]["Row"];
type TrainingProgramRow =
  Database["public"]["Tables"]["training_programs"]["Row"];
type ElearningEnrollmentRow =
  Database["public"]["Tables"]["elearning_enrollments"]["Row"];
type ElearningCourseRow =
  Database["public"]["Tables"]["elearning_courses"]["Row"];

const DEFAULT_APPLICATION_FEE = 25000;
const ALLOWED_ADMIN_ROLES = new Set([
  "admissions_officer",
  "training_coordinator",
  "admin",
  "super_admin",
]);

const PROGRAMME_TITLES: Record<string, string> = {
  "msc-food-science-technology": "M.Sc. Food Science & Technology",
  "msc-agricultural-science": "M.Sc. Agricultural Science",
  "msc-environmental-resource-management":
    "M.Sc. Environmental Resource Management",
  "msc-agricultural-economics": "M.Sc. Agricultural Economics",
};

const FALLBACK_BANK_CONFIG = {
  bankName: "Access Bank PLC",
  accountNumber: "1886573891",
  accountName: "University of Jos External Funded Account",
  instructions:
    "Transfer the exact amount and upload your transfer receipt for review.",
};

export type PaymentDisplayStatus =
  | "pending"
  | "pending_receipt"
  | "pending_approval"
  | "successful"
  | "failed";

export interface AdminPaymentListItem {
  id: string;
  userId: string;
  applicantName: string;
  applicantEmail: string | null;
  entityType: PaymentRow["entity_type"];
  entityId: string;
  programmeName: string;
  amount: number;
  createdAt: string;
  paymentDate: string | null;
  dbStatus: PaymentRow["status"];
  status: PaymentDisplayStatus;
  rrr: string | null;
  receiptStoragePath: string | null;
  receiptUploadedAt: string | null;
  adminApprovedAt: string | null;
  adminApprovedBy: string | null;
  adminNotes: string | null;
}

export interface PaymentStatusResult {
  paymentId: string | null;
  status: PaymentDisplayStatus;
  amount: number;
  receiptUploadedAt?: string;
  paymentDate?: string;
  message?: string;
}

async function getCurrentUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("UNAUTHENTICATED");
  return { supabase, user };
}

async function getCurrentAdminContext() {
  const { supabase, user } = await getCurrentUserContext();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle<{ role: ProfileRow["role"] }>();

  if (error) throw new Error(error.message);
  if (!profile || !ALLOWED_ADMIN_ROLES.has(profile.role)) {
    throw new Error("FORBIDDEN");
  }

  return { user };
}

async function getLatestApplicationForUser(
  userId: string
): Promise<ApplicationRow | null> {
  const { data, error } = await adminClient
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ApplicationRow | null;
}

function resolveProgrammeNameFromSlug(slug: string | null): string {
  if (!slug) return "Postgraduate Application";
  return PROGRAMME_TITLES[slug] || slug;
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function derivePaymentStatus(payment: {
  status: PaymentRow["status"];
  receipt_uploaded_at: string | null;
  receipt_storage_path: string | null;
}): PaymentDisplayStatus {
  if (payment.status === "successful") return "successful";
  if (payment.status === "failed") return "failed";
  if (payment.receipt_uploaded_at || payment.receipt_storage_path) {
    return "pending_approval";
  }
  return "pending_receipt";
}

function normalizeStatusFilter(
  raw?: string
): PaymentDisplayStatus | undefined {
  if (!raw || raw === "all") return undefined;
  if (raw === "approved") return "successful";
  if (raw === "rejected") return "failed";

  const value = raw as PaymentDisplayStatus;
  if (
    value === "pending" ||
    value === "pending_receipt" ||
    value === "pending_approval" ||
    value === "successful" ||
    value === "failed"
  ) {
    return value;
  }

  return undefined;
}

function normalizeSearch(value?: string): string {
  return (value || "").trim().toLowerCase();
}

function clampPage(value?: number): number {
  const page = Number(value || 1);
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.trunc(page));
}

function clampLimit(value?: number): number {
  const limit = Number(value || 20);
  if (!Number.isFinite(limit)) return 20;
  return Math.min(100, Math.max(1, Math.trunc(limit)));
}

async function resolveEntityProgrammeNames(payments: PaymentRow[]) {
  const entityTypeToName = new Map<string, string>();

  const applicationIds = payments
    .filter((row) => row.entity_type === "application")
    .map((row) => row.entity_id);

  if (applicationIds.length > 0) {
    const { data, error } = await adminClient
      .from("applications")
      .select("id,programme_id")
      .in("id", applicationIds);

    if (error) throw new Error(error.message);

    (data || []).forEach((row) => {
      const app = row as Pick<ApplicationRow, "id" | "programme_id">;
      entityTypeToName.set(app.id, resolveProgrammeNameFromSlug(app.programme_id));
    });
  }

  const trainingApplicationIds = payments
    .filter((row) => row.entity_type === "training_application")
    .map((row) => row.entity_id);

  if (trainingApplicationIds.length > 0) {
    const { data: trainingApplications, error: taError } = await adminClient
      .from("training_applications")
      .select("id,training_id")
      .in("id", trainingApplicationIds);

    if (taError) throw new Error(taError.message);

    const trainingIds = Array.from(
      new Set(
        (trainingApplications || []).map(
          (row) => (row as Pick<TrainingApplicationRow, "training_id">).training_id
        )
      )
    );

    if (trainingIds.length > 0) {
      const { data: trainingPrograms, error: tpError } = await adminClient
        .from("training_programs")
        .select("id,title")
        .in("id", trainingIds);

      if (tpError) throw new Error(tpError.message);

      const trainingMap = new Map<string, string>();
      (trainingPrograms || []).forEach((row) => {
        const tp = row as Pick<TrainingProgramRow, "id" | "title">;
        trainingMap.set(tp.id, tp.title);
      });

      (trainingApplications || []).forEach((row) => {
        const ta = row as Pick<TrainingApplicationRow, "id" | "training_id">;
        entityTypeToName.set(
          ta.id,
          trainingMap.get(ta.training_id) || "Training Programme"
        );
      });
    }
  }

  const enrollmentIds = payments
    .filter((row) => row.entity_type === "elearning_enrollment")
    .map((row) => row.entity_id);

  if (enrollmentIds.length > 0) {
    const { data: enrollments, error: enrollmentError } = await adminClient
      .from("elearning_enrollments")
      .select("id,course_id")
      .in("id", enrollmentIds);

    if (enrollmentError) throw new Error(enrollmentError.message);

    const courseIds = Array.from(
      new Set(
        (enrollments || []).map(
          (row) => (row as Pick<ElearningEnrollmentRow, "course_id">).course_id
        )
      )
    );

    if (courseIds.length > 0) {
      const { data: courses, error: courseError } = await adminClient
        .from("elearning_courses")
        .select("id,title")
        .in("id", courseIds);

      if (courseError) throw new Error(courseError.message);

      const courseMap = new Map<string, string>();
      (courses || []).forEach((row) => {
        const course = row as Pick<ElearningCourseRow, "id" | "title">;
        courseMap.set(course.id, course.title);
      });

      (enrollments || []).forEach((row) => {
        const enrollment = row as Pick<
          ElearningEnrollmentRow,
          "id" | "course_id"
        >;
        entityTypeToName.set(
          enrollment.id,
          courseMap.get(enrollment.course_id) || "E-Learning Course"
        );
      });
    }
  }

  return entityTypeToName;
}

async function resolveUserIdentityMaps(payments: PaymentRow[]) {
  const userIds = Array.from(new Set(payments.map((row) => row.user_id)));

  if (userIds.length === 0) {
    return {
      names: new Map<string, string>(),
      emails: new Map<string, string>(),
    };
  }

  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("user_id,first_name,last_name")
    .in("user_id", userIds);

  if (error) throw new Error(error.message);

  const names = new Map<string, string>();
  (profiles || []).forEach((row) => {
    const profile = row as Pick<
      ProfileRow,
      "user_id" | "first_name" | "last_name"
    >;
    names.set(
      profile.user_id,
      `${profile.first_name} ${profile.last_name}`.trim() || "Applicant"
    );
  });

  const emails = new Map<string, string>();
  try {
    const { data: usersData } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    (usersData?.users || []).forEach((user) => {
      if (user.email) {
        emails.set(user.id, user.email);
      }
    });
  } catch {
    // Best effort only.
  }

  return { names, emails };
}

async function resolveEntityIdForCreate(input: {
  entityType: PaymentRow["entity_type"];
  entityId?: string;
  userId: string;
}) {
  if (input.entityId) return input.entityId;

  if (input.entityType === "application") {
    const application = await getLatestApplicationForUser(input.userId);
    if (!application) {
      throw new Error("No application draft found for payment.");
    }
    return application.id;
  }

  throw new Error("Entity ID is required for this payment type.");
}

export async function createManualPayment(input: {
  entityType: PaymentRow["entity_type"];
  entityId?: string;
  amount: number;
}) {
  const amount = input.amount || DEFAULT_APPLICATION_FEE;
  const { user } = await getCurrentUserContext();
  const entityId = await resolveEntityIdForCreate({
    entityType: input.entityType,
    entityId: input.entityId,
    userId: user.id,
  });

  const paymentsTable = adminClient.from("payments") as any;

  const { data: existingPayment, error: existingError } = await paymentsTable
    .select("*")
    .eq("user_id", user.id)
    .eq("entity_type", input.entityType)
    .eq("entity_id", entityId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existingPayment) {
    const payment = existingPayment as PaymentRow;
    return {
      paymentId: payment.id,
      amount: toNumber(payment.amount),
      status: payment.status,
      createdAt: payment.created_at,
      reused: true,
    };
  }

  const { data: inserted, error: insertError } = await paymentsTable
    .insert({
      user_id: user.id,
      entity_type: input.entityType,
      entity_id: entityId,
      rrr: null,
      amount,
      status: "pending",
      payment_date: null,
      confirmed_by: "manual_bank_transfer",
      admin_override_reason: null,
      receipt_storage_path: null,
      receipt_uploaded_at: null,
      admin_approved_at: null,
      admin_approved_by: null,
      admin_notes: null,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message || "Could not create payment record.");
  }

  const payment = inserted as PaymentRow;
  return {
    paymentId: payment.id,
    amount: toNumber(payment.amount),
    status: payment.status,
    createdAt: payment.created_at,
    reused: false,
  };
}

export async function getPaymentStatus(
  entityType: PaymentRow["entity_type"],
  entityId: string
): Promise<PaymentStatusResult> {
  const { user } = await getCurrentUserContext();

  const { data, error } = await adminClient
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    return {
      paymentId: null,
      status: "pending",
      amount: 0,
      message: "Payment has not been created for this application.",
    };
  }

  const payment = data as PaymentRow;
  const status = derivePaymentStatus(payment);

  return {
    paymentId: payment.id,
    status,
    amount: toNumber(payment.amount),
    receiptUploadedAt: payment.receipt_uploaded_at || undefined,
    paymentDate: payment.payment_date || undefined,
    message:
      status === "pending_approval"
        ? "Receipt uploaded and pending admin review."
        : status === "successful"
          ? "Payment approved."
          : status === "failed"
            ? "Payment was rejected. Please upload a new receipt."
            : "Awaiting receipt upload.",
  };
}

export async function getBankTransferConfig(): Promise<{
  bankName: string;
  accountNumber: string;
  accountName: string;
  instructions?: string;
}> {
  const { data, error } = await adminClient
    .from("bank_transfer_configs")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return FALLBACK_BANK_CONFIG;

  const config = data as BankTransferConfigRow;
  return {
    bankName: config.bank_name,
    accountNumber: config.account_number,
    accountName: config.account_name,
    instructions: config.instructions || FALLBACK_BANK_CONFIG.instructions,
  };
}

export async function uploadPaymentReceipt(input: {
  paymentId: string;
  filePath: string;
}): Promise<{ success: true; receiptUploadedAt: string }> {
  const { user } = await getCurrentUserContext();
  const paymentId = input.paymentId.trim();
  const filePath = input.filePath.trim();

  if (!paymentId) throw new Error("Payment ID is required.");
  if (!filePath) throw new Error("Receipt file path is required.");

  const paymentsTable = adminClient.from("payments") as any;
  const { data: existingPayment, error: lookupError } = await paymentsTable
    .select("id,user_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (!existingPayment) throw new Error("Payment record not found.");
  if ((existingPayment as Pick<PaymentRow, "user_id">).user_id !== user.id) {
    throw new Error("FORBIDDEN");
  }

  const receiptUploadedAt = new Date().toISOString();
  const { error: updateError } = await paymentsTable
    .update({
      receipt_storage_path: filePath,
      receipt_uploaded_at: receiptUploadedAt,
      status: "pending",
      payment_date: new Date().toISOString(),
      confirmed_by: "manual_bank_transfer",
      admin_approved_at: null,
      admin_approved_by: null,
      admin_notes: null,
    })
    .eq("id", paymentId)
    .eq("user_id", user.id);

  if (updateError) throw new Error(updateError.message);

  return { success: true, receiptUploadedAt };
}

export async function uploadPaymentReceiptFile(input: {
  paymentId: string;
  filename: string;
  contentType: string;
  contentLength: number;
  data: Uint8Array;
}): Promise<{ success: true; receiptUploadedAt: string; filePath: string }> {
  const { user } = await getCurrentUserContext();
  const paymentId = input.paymentId.trim();

  if (!paymentId) throw new Error("Payment ID is required.");

  validateUpload(input.contentType, input.contentLength, ALLOWED_RECEIPT_TYPES);

  if (!privateR2Client || !PRIVATE_R2_BUCKET) {
    throw new Error("Private document storage is not configured.");
  }

  const filePath = buildDocumentKey(
    "paymentReceipt",
    user.id,
    paymentId,
    input.filename || "receipt"
  );

  await privateR2Client.send(
    new PutObjectCommand({
      Bucket: PRIVATE_R2_BUCKET,
      Key: filePath,
      Body: input.data,
      ContentType: input.contentType,
      ContentLength: input.contentLength,
    })
  );

  const result = await uploadPaymentReceipt({ paymentId, filePath });
  return { ...result, filePath };
}

async function assertPaymentEntityExists(payment: PaymentRow) {
  if (payment.entity_type === "application") {
    const { data, error } = await adminClient
      .from("applications")
      .select("id")
      .eq("id", payment.entity_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      throw new Error("This payment is linked to a missing postgraduate application. Please repair the payment record and retry.");
    }
    return;
  }

  if (payment.entity_type === "training_application") {
    const { data, error } = await adminClient
      .from("training_applications")
      .select("id")
      .eq("id", payment.entity_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      throw new Error("This payment is linked to a missing training registration. Please repair the payment record and retry.");
    }
    return;
  }

  if (payment.entity_type === "elearning_enrollment") {
    const { data, error } = await adminClient
      .from("elearning_enrollments")
      .select("id")
      .eq("id", payment.entity_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      throw new Error("This payment is linked to a missing e-learning enrollment. Please repair the payment record and retry.");
    }
  }
}

export async function approvePayment(input: {
  paymentId: string;
  adminNotes?: string;
}): Promise<{ success: true; paymentId: string }> {
  const { user } = await getCurrentAdminContext();
  const paymentId = input.paymentId.trim();

  if (!paymentId) throw new Error("Payment ID is required.");

  const paymentsTable = adminClient.from("payments") as any;
  const { data: payment, error: lookupError } = await paymentsTable
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (!payment) throw new Error("Payment not found.");

  const paymentRow = payment as PaymentRow;
  if (!paymentRow.receipt_storage_path) {
    throw new Error("Receipt is required before payment can be approved.");
  }
  await assertPaymentEntityExists(paymentRow);

  const now = new Date().toISOString();
  const { error: updateError } = await paymentsTable
    .update({
      status: "successful",
      confirmed_by: "manual_bank_transfer",
      payment_date: paymentRow.payment_date || now,
      admin_approved_at: now,
      admin_approved_by: user.id,
      admin_notes: (input.adminNotes || "").trim() || null,
      admin_override_reason: null,
    })
    .eq("id", paymentId);

  if (updateError) throw new Error(updateError.message);

  const { data: profile } = await adminClient
    .from("profiles")
    .select("first_name,last_name,email")
    .eq("user_id", paymentRow.user_id)
    .maybeSingle() as { data: { first_name: string; last_name: string; email: string } | null };

  if (profile?.email) {
    const paidAt = paymentRow.payment_date
      ? new Date(paymentRow.payment_date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

    const emailResult = await sendEmailWithResend({
      to: profile.email,
      ...buildPaymentApprovedEmail({
        recipientEmail: profile.email,
        recipientName: `${profile.first_name} ${profile.last_name}`.trim(),
        applicationRef: (paymentRow as any).reference || paymentId.slice(0, 12).toUpperCase(),
        amount: `₦${(paymentRow.amount || 0).toLocaleString()}`,
        paidAt,
      }),
    });
    console.log("[approvePayment] Email result:", emailResult);
  }

  return { success: true, paymentId };
}

export async function rejectPayment(input: {
  paymentId: string;
  reason: string;
}): Promise<{ success: true; paymentId: string }> {
  const { user } = await getCurrentAdminContext();
  const paymentId = input.paymentId.trim();
  const reason = input.reason.trim();

  if (!paymentId) throw new Error("Payment ID is required.");
  if (!reason) throw new Error("Rejection reason is required.");

  const paymentsTable = adminClient.from("payments") as any;
  const { data: payment, error: lookupError } = await paymentsTable
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (!payment) throw new Error("Payment not found.");

  const paymentRow = payment as PaymentRow;
  await assertPaymentEntityExists(paymentRow);

  const now = new Date().toISOString();
  const { error: updateError } = await paymentsTable
    .update({
      status: "failed",
      confirmed_by: "manual_bank_transfer",
      payment_date: paymentRow.payment_date || now,
      admin_approved_at: now,
      admin_approved_by: user.id,
      admin_notes: reason,
      admin_override_reason: null,
    })
    .eq("id", paymentId);

  if (updateError) throw new Error(updateError.message);

  const { data: profile } = await adminClient
    .from("profiles")
    .select("first_name,last_name,email")
    .eq("user_id", paymentRow.user_id)
    .maybeSingle() as { data: { first_name: string; last_name: string; email: string } | null };

  if (profile?.email) {
    const paidAt = paymentRow.payment_date
      ? new Date(paymentRow.payment_date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

    const emailResult = await sendEmailWithResend({
      to: profile.email,
      ...buildPaymentRejectedEmail({
        recipientEmail: profile.email,
        recipientName: `${profile.first_name} ${profile.last_name}`.trim(),
        applicationRef: (paymentRow as any).reference || paymentId.slice(0, 12).toUpperCase(),
        amount: `₦${(paymentRow.amount || 0).toLocaleString()}`,
        paidAt,
        reason,
      }),
    });
    console.log("[rejectPayment] Email result:", emailResult);
  }

  return { success: true, paymentId };
}

export async function getAdminPaymentList(input: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ payments: AdminPaymentListItem[]; total: number; page: number; limit: number }> {
  await getCurrentAdminContext();

  const page = clampPage(input.page);
  const limit = clampLimit(input.limit);
  const statusFilter = normalizeStatusFilter(input.status);
  const searchFilter = normalizeSearch(input.search);

  const { data, error } = await adminClient
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data || []) as PaymentRow[];
  const [entityNameMap, identityMaps] = await Promise.all([
    resolveEntityProgrammeNames(rows),
    resolveUserIdentityMaps(rows),
  ]);

  const mapped = rows.map((row) => {
    const status = derivePaymentStatus(row);
    return {
      id: row.id,
      userId: row.user_id,
      applicantName: identityMaps.names.get(row.user_id) || "Applicant",
      applicantEmail: identityMaps.emails.get(row.user_id) || null,
      entityType: row.entity_type,
      entityId: row.entity_id,
      programmeName:
        entityNameMap.get(row.entity_id) ||
        (row.entity_type === "application"
          ? "Postgraduate Application"
          : row.entity_type === "training_application"
            ? "Training Programme"
            : "E-Learning Course"),
      amount: toNumber(row.amount),
      createdAt: row.created_at,
      paymentDate: row.payment_date,
      dbStatus: row.status,
      status,
      rrr: row.rrr,
      receiptStoragePath: row.receipt_storage_path,
      receiptUploadedAt: row.receipt_uploaded_at,
      adminApprovedAt: row.admin_approved_at,
      adminApprovedBy: row.admin_approved_by,
      adminNotes: row.admin_notes,
    } satisfies AdminPaymentListItem;
  });

  const filtered = mapped.filter((row) => {
    if (statusFilter && row.status !== statusFilter) {
      return false;
    }

    if (!searchFilter) {
      return true;
    }

    const bucket = [
      row.id,
      row.rrr || "",
      row.applicantName,
      row.applicantEmail || "",
      row.programmeName,
      row.entityType,
      row.status,
    ]
      .join(" ")
      .toLowerCase();

    return bucket.includes(searchFilter);
  });

  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    payments: filtered.slice(start, end),
    total,
    page,
    limit,
  };
}

export async function generateApplicationRRR(input?: { amount?: number }) {
  const result = await createManualPayment({
    entityType: "application",
    amount: input?.amount || DEFAULT_APPLICATION_FEE,
  });

  return {
    rrr: null,
    amount: result.amount,
    status: result.status,
    paymentId: result.paymentId,
    reused: result.reused,
  };
}

export async function verifyCurrentUserPaymentByRRR(rrr: string) {
  const cleanRrr = rrr.trim();
  const { user } = await getCurrentUserContext();

  if (!cleanRrr) {
    throw new Error("Payment reference is required.");
  }

  const { data, error } = await adminClient
    .from("payments")
    .select("entity_type,entity_id")
    .eq("rrr", cleanRrr)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("Payment reference not found for this user.");
  }

  const payment = data as Pick<PaymentRow, "entity_type" | "entity_id">;
  const status = await getPaymentStatus(payment.entity_type, payment.entity_id);

  return {
    rrr: cleanRrr,
    isPaid: status.status === "successful",
    status: status.status,
    message: status.message,
    amount: status.amount,
    paymentDate: status.paymentDate,
  };
}

export async function processRemitaWebhook(rawPayload: RemitaWebhookPayload) {
  const valid = verifyWebhookSignature(rawPayload);
  if (!valid) {
    throw new Error("Invalid webhook signature.");
  }

  const paymentsTable = adminClient.from("payments") as any;
  const { data: payment, error: lookupError } = await paymentsTable
    .select("*")
    .eq("rrr", rawPayload.rrr)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (!payment) throw new Error("Payment not found for webhook RRR.");

  const isPaid = rawPayload.status === "00" || rawPayload.status === "01";

  const updatePayload = {
    status: isPaid ? "successful" : "failed",
    payment_date: rawPayload.paymentDate || new Date().toISOString(),
    confirmed_by: isPaid ? "webhook" : null,
    admin_override_reason: null,
  };

  const { error: updateError } = await paymentsTable
    .update(updatePayload)
    .eq("id", (payment as PaymentRow).id);
  if (updateError) throw new Error(updateError.message);

  return { success: true, isPaid, rrr: rawPayload.rrr };
}
