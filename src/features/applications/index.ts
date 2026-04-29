import { createClient } from "@/lib/supabase/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  ALLOWED_DOCUMENT_TYPES,
  buildDocumentKey,
  validateUpload,
} from "@/lib/storage/upload";
import { PRIVATE_R2_BUCKET, privateR2Client } from "@/lib/storage/r2";
import type { Database, DocumentType } from "@/types/database.types";
import { getPostgraduateProgrammeOptions } from "@/features/postgraduate/catalogue";
import {
  getApplicationProgress,
  type ApplicationPaymentStatus,
} from "./progress";

type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

const UNSELECTED_PROGRAMME_SLUG = "pending-selection";
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

export const REQUIRED_DOCUMENTS: Array<{ type: DocumentType; label: string }> = [
  { type: "transcript", label: "Academic Transcript" },
  { type: "degree_certificate", label: "Degree Certificate" },
  { type: "passport_photo", label: "Passport Photo" },
  { type: "id_card", label: "NYSC Certificate" },
  { type: "cv", label: "2 Referees' Letters" },
];

type SnapshotState = "start" | "in_progress" | "approved" | "rejected";

export interface RejectionHistoryItem {
  applicationPublicId: string;
  programmeLabel: string;
  rejectedAt: string;
  reason: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface DashboardSnapshotOptions {
  ensureDraft?: boolean;
  programmeSlug?: string | null;
}

export interface PersonalDetailsInput {
  firstName: string;
  lastName: string;
  phone?: string;
  personalStatement?: string;
}

export interface ApplicantDashboardSnapshot {
  name: string;
  initials: string;
  applicationState: SnapshotState;
  currentStep: number;
  requiredDocuments: number;
  uploadedDocuments: number;
  missingDocuments: string[];
  programmeLabel: string;
  programmeSlug: string;
  programmeSelected: boolean;
  applicationId: string | null;
  applicationPublicId: string;
  lastSavedLabel: string;
  paymentStatus:
    | "pending"
    | "pending_receipt"
    | "pending_approval"
    | "successful"
    | "failed"
    | "none";
  paymentId: string | null;
  paymentRrr: string | null;
  paymentAmount: number | null;
  receiptUploadedAt: string | null;
  personalDetailsComplete: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  personalStatement: string;
  rejectionHistory: RejectionHistoryItem[];
}

export interface DocumentChecklistItem {
  type: DocumentType;
  label: string;
  uploaded: boolean;
  filePath: string | null;
}

function resolveProgrammeSlug(raw: string | null | undefined, programmeTitles: Map<string, string>): string {
  if (!raw) return UNSELECTED_PROGRAMME_SLUG;
  return programmeTitles.has(raw) ? raw : UNSELECTED_PROGRAMME_SLUG;
}

function programmeLabelFromSlug(slug: string, programmeTitles: Map<string, string>): string {
  return programmeTitles.get(slug) || "Not selected";
}

function isProgrammeSelected(programmeSlug: string, programmeTitles: Map<string, string>): boolean {
  return programmeTitles.has(programmeSlug);
}

async function getProgrammeTitleMap() {
  const options = await getPostgraduateProgrammeOptions();
  return new Map(options.map((item) => [item.slug, item.label]));
}

function displayName(
  profile: Pick<ProfileRow, "first_name" | "last_name"> | null,
  email: string | null
) {
  if (profile) return `${profile.first_name} ${profile.last_name}`.trim();
  return email || "Applicant";
}

function initialsFromName(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDateLabel(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildApplicationPublicId(application: ApplicationRow): string {
  const year = new Date(application.created_at).getFullYear();
  const compact = application.id.replace(/-/g, "").slice(0, 8);
  const numeric = Number.parseInt(compact, 16) % 10000;
  return `APP-${year}-${String(numeric).padStart(4, "0")}`;
}

function validatePersonalDetails(input: PersonalDetailsInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = (input.phone || "").trim();
  const personalStatement = (input.personalStatement || "").trim();

  if (firstName.length < 2) {
    issues.push({ field: "firstName", message: "First name must be at least 2 characters." });
  }
  if (lastName.length < 2) {
    issues.push({ field: "lastName", message: "Last name must be at least 2 characters." });
  }
  if (!PHONE_PATTERN.test(phone)) {
    issues.push({ field: "phone", message: "Enter a valid phone number." });
  }
  if (personalStatement.length < 20) {
    issues.push({ field: "personalStatement", message: "Personal statement must be at least 20 characters." });
  }

  return issues;
}

function checkPersonalCompleteness(
  profile: Pick<ProfileRow, "first_name" | "last_name" | "phone"> | null,
  application: Pick<ApplicationRow, "personal_statement"> | null
): boolean {
  if (!profile || !application) return false;
  const firstOk = profile.first_name.trim().length >= 2;
  const lastOk = profile.last_name.trim().length >= 2;
  const phoneOk = !!profile.phone && PHONE_PATTERN.test(profile.phone);
  const statementOk =
    !!application.personal_statement &&
    application.personal_statement.trim().length >= 20;
  return firstOk && lastOk && phoneOk && statementOk;
}

async function getCurrentUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("UNAUTHENTICATED");

  return { supabase, user };
}

type UserContext = Awaited<ReturnType<typeof getCurrentUserContext>>;

async function getLatestApplication(
  userId: string,
  context?: UserContext
): Promise<ApplicationRow | null> {
  const supabase = context?.supabase || (await getCurrentUserContext()).supabase;
  const applicationsTable = supabase.from("applications") as any;
  const { data, error } = await applicationsTable
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ApplicationRow | null;
}

async function ensureDraftApplication(
  userId: string,
  programmeSlug?: string | null,
  context?: UserContext
): Promise<ApplicationRow> {
  const existing = await getLatestApplication(userId, context);
  if (existing && existing.status !== "rejected") return existing;

  const supabase = context?.supabase || (await getCurrentUserContext()).supabase;
  const programmeTitles = await getProgrammeTitleMap();
  const payload = {
    user_id: userId,
    programme_id: resolveProgrammeSlug(programmeSlug || existing?.programme_id, programmeTitles),
    status: "pending",
    personal_statement: "",
  };
  const applicationsTable = supabase.from("applications") as any;

  const { data, error } = await applicationsTable
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not create application draft.");
  }

  return data as ApplicationRow;
}

async function getDocumentMap(applicationId: string, context?: UserContext) {
  const supabase = context?.supabase || (await getCurrentUserContext()).supabase;
  const docsTable = supabase.from("application_documents") as any;
  const { data, error } = await docsTable
    .select("document_type,file_path")
    .eq("application_id", applicationId);

  if (error) throw new Error(error.message);

  const map = new Map<string, string>();
  for (const row of (data || []) as Array<{ document_type: string; file_path: string }>) {
    map.set(row.document_type, row.file_path);
  }
  return map;
}

export async function getApplicantDashboardSnapshot(
  options: DashboardSnapshotOptions = {},
  context?: UserContext
): Promise<ApplicantDashboardSnapshot> {
  const { supabase, user } = context || (await getCurrentUserContext());
  const programmeTitles = await getProgrammeTitleMap();

  const application = options.ensureDraft
    ? await ensureDraftApplication(user.id, options.programmeSlug, {
        supabase,
        user,
      })
    : await getLatestApplication(user.id, { supabase, user });

  const profileQuery = supabase
    .from("profiles")
    .select("first_name,last_name,phone")
    .eq("user_id", user.id)
    .maybeSingle();

  const docsQuery = application
    ? supabase
        .from("application_documents")
        .select("document_type")
        .eq("application_id", application.id)
    : Promise.resolve({ data: [] as Array<{ document_type: DocumentType }>, error: null });

  const paymentQuery = application
    ? supabase
        .from("payments")
        .select(
          "id,status,rrr,amount,receipt_storage_path,receipt_uploaded_at,admin_approved_at"
        )
        .eq("entity_type", "application")
        .eq("entity_id", application.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : Promise.resolve({ data: null as any, error: null });

  const rejectedAppsQuery = supabase
    .from("applications")
    .select("id,programme_id,updated_at,status,admin_notes")
    .eq("user_id", user.id)
    .eq("status", "rejected")
    .order("updated_at", { ascending: false });

  const failedPaymentsQuery = supabase
    .from("payments")
    .select("entity_id,admin_notes,updated_at")
    .eq("user_id", user.id)
    .eq("entity_type", "application")
    .eq("status", "failed")
    .order("updated_at", { ascending: false });

  const [
    profileResp,
    docsResp,
    paymentResp,
    rejectedAppsResp,
    failedPaymentsResp,
  ] = await Promise.all([
    profileQuery,
    docsQuery,
    paymentQuery,
    rejectedAppsQuery,
    failedPaymentsQuery,
  ]);

  if (profileResp.error) throw new Error(profileResp.error.message);
  if (docsResp.error) throw new Error(docsResp.error.message);
  if (paymentResp.error) throw new Error(paymentResp.error.message);
  if (rejectedAppsResp.error) throw new Error(rejectedAppsResp.error.message);
  if (failedPaymentsResp.error) throw new Error(failedPaymentsResp.error.message);

  const profile = (profileResp.data || null) as Pick<
    ProfileRow,
    "first_name" | "last_name" | "phone"
  > | null;

  const rejectedRows =
    (rejectedAppsResp.data || []) as Array<
      Pick<ApplicationRow, "id" | "programme_id" | "updated_at" | "status" | "admin_notes">
    >;

  const failedPaymentRows =
    (failedPaymentsResp.data || []) as Array<{
      entity_id: string;
      admin_notes: string | null;
      updated_at: string;
    }>;

  const rejectionReasonByApplicationId = new Map<string, string>();
  for (const row of failedPaymentRows) {
    if (row.admin_notes && !rejectionReasonByApplicationId.has(row.entity_id)) {
      rejectionReasonByApplicationId.set(row.entity_id, row.admin_notes);
    }
  }

  const rejectionHistory: RejectionHistoryItem[] = rejectedRows.map((row) => ({
    applicationPublicId: buildApplicationPublicId({
      id: row.id,
      created_at: row.updated_at,
    } as ApplicationRow),
    programmeLabel: programmeLabelFromSlug(row.programme_id, programmeTitles),
    rejectedAt: row.updated_at,
    reason:
      row.admin_notes ??
      rejectionReasonByApplicationId.get(row.id) ??
      "Application was not approved by admissions.",
  }));
  const fullName = displayName(profile, user.email || null);
  const initials = initialsFromName(fullName);

  if (!application) {
    return {
      name: fullName,
      initials,
      applicationState: "start",
      currentStep: 1,
      requiredDocuments: REQUIRED_DOCUMENTS.length,
      uploadedDocuments: 0,
      missingDocuments: REQUIRED_DOCUMENTS.map((doc) => doc.label),
      programmeLabel: "Not selected",
      programmeSlug: UNSELECTED_PROGRAMME_SLUG,
      programmeSelected: false,
      applicationId: null,
      applicationPublicId: "—",
      lastSavedLabel: "—",
      paymentStatus: "none",
      paymentId: null,
      paymentRrr: null,
      paymentAmount: null,
      receiptUploadedAt: null,
      personalDetailsComplete: false,
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      phone: profile?.phone || "",
      personalStatement: "",
      rejectionHistory,
    };
  }

  const docs = (docsResp.data || []) as Array<{ document_type: DocumentType }>;
  const uploadedTypeSet = new Set(docs.map((doc) => doc.document_type));
  const missingDocuments = REQUIRED_DOCUMENTS.filter(
    (doc) => !uploadedTypeSet.has(doc.type)
  ).map((doc) => doc.label);
  const uploadedDocuments = REQUIRED_DOCUMENTS.length - missingDocuments.length;

  const payment = paymentResp.data as
    | Pick<
        PaymentRow,
        | "id"
        | "status"
        | "rrr"
        | "amount"
        | "receipt_storage_path"
        | "receipt_uploaded_at"
        | "admin_approved_at"
      >
    | null;
  let paymentStatus: ApplicationPaymentStatus = "none";

  if (payment) {
    if (payment.status === "successful") {
      paymentStatus = "successful";
    } else if (payment.status === "failed") {
      paymentStatus = "failed";
    } else if (payment.receipt_uploaded_at || payment.receipt_storage_path) {
      paymentStatus = "pending_approval";
    } else {
      paymentStatus = "pending_receipt";
    }
  }

  const programmeSelected = isProgrammeSelected(application.programme_id, programmeTitles);
  const personalDetailsComplete = checkPersonalCompleteness(profile, application);
  const progress = getApplicationProgress({
    programmeSelected,
    personalDetailsComplete,
    documentsComplete: uploadedDocuments >= REQUIRED_DOCUMENTS.length,
    paymentStatus,
  });

  return {
    name: fullName,
    initials,
    applicationState:
      application.status === "approved"
        ? "approved"
        : application.status === "rejected"
          ? "rejected"
          : "in_progress",
    currentStep: progress.currentStep,
    requiredDocuments: REQUIRED_DOCUMENTS.length,
    uploadedDocuments,
    missingDocuments,
    programmeLabel: programmeLabelFromSlug(application.programme_id, programmeTitles),
    programmeSlug: resolveProgrammeSlug(application.programme_id, programmeTitles),
    programmeSelected,
    applicationId: application.id,
    applicationPublicId: buildApplicationPublicId(application),
    lastSavedLabel: formatDateLabel(application.updated_at),
    paymentStatus,
    paymentId: payment?.id || null,
    paymentRrr: payment?.rrr || null,
    paymentAmount: payment?.amount || null,
    receiptUploadedAt: payment?.receipt_uploaded_at || null,
    personalDetailsComplete,
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    phone: profile?.phone || "",
    personalStatement: application.personal_statement || "",
    rejectionHistory,
  };
}

export async function setApplicationProgramme(
  programmeSlug: string
): Promise<
  | { success: true; programmeSlug: string; programmeLabel: string }
  | { success: false; issues: ValidationIssue[] }
> {
  const raw = programmeSlug.trim();
  const programmeTitles = await getProgrammeTitleMap();
  if (!programmeTitles.has(raw)) {
    return {
      success: false,
      issues: [{ field: "programme", message: "Please choose a valid programme." }],
    };
  }

  const { supabase, user } = await getCurrentUserContext();
  const draft = await ensureDraftApplication(user.id, raw, { supabase, user });

  const updatePayload = {
    programme_id: raw,
  };

  const applicationsTable = supabase.from("applications") as any;

  const { error } = await applicationsTable
    .update(updatePayload)
    .eq("id", draft.id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  return {
    success: true,
    programmeSlug: raw,
    programmeLabel: programmeLabelFromSlug(raw, programmeTitles),
  };
}

export async function saveApplicantPersonalDetails(
  input: PersonalDetailsInput
): Promise<{ success: true } | { success: false; issues: ValidationIssue[] }> {
  const issues = validatePersonalDetails(input);
  if (issues.length > 0) return { success: false, issues };

  const { supabase, user } = await getCurrentUserContext();
  const draft = await ensureDraftApplication(user.id, undefined, {
    supabase,
    user,
  });

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = (input.phone || "").trim();
  const personalStatement = (input.personalStatement || "").trim();

  const profileUpdate = {
    first_name: firstName,
    last_name: lastName,
    phone,
  };

  const appUpdate = {
    personal_statement: personalStatement,
  };

  const profilesTable = supabase.from("profiles") as any;
  const applicationsTable = supabase.from("applications") as any;

  const { error: profileError } = await profilesTable
    .update(profileUpdate)
    .eq("user_id", user.id);
  if (profileError) throw new Error(profileError.message);

  const { error: appError } = await applicationsTable
    .update(appUpdate)
    .eq("id", draft.id)
    .eq("user_id", user.id);
  if (appError) throw new Error(appError.message);

  return { success: true };
}

export async function getApplicationDocumentChecklist() {
  const { supabase, user } = await getCurrentUserContext();
  const app = await ensureDraftApplication(user.id, undefined, {
    supabase,
    user,
  });
  const uploadedMap = await getDocumentMap(app.id, { supabase, user });

  const items: DocumentChecklistItem[] = REQUIRED_DOCUMENTS.map((doc) => ({
    type: doc.type,
    label: doc.label,
    uploaded: uploadedMap.has(doc.type),
    filePath: uploadedMap.get(doc.type) || null,
  }));

  const uploadedCount = items.filter((item) => item.uploaded).length;
  return {
    applicationId: app.id,
    items,
    uploadedCount,
    requiredCount: items.length,
    complete: uploadedCount === items.length,
  };
}

export async function uploadApplicationDocument(input: {
  documentType: DocumentType;
  filename: string;
  contentType: string;
  contentLength: number;
  data: Uint8Array;
}) {
  const { supabase, user } = await getCurrentUserContext();
  const app = await ensureDraftApplication(user.id, undefined, {
    supabase,
    user,
  });

  if (!REQUIRED_DOCUMENTS.some((doc) => doc.type === input.documentType)) {
    throw new Error("Unsupported document type.");
  }

  validateUpload(input.contentType, input.contentLength, ALLOWED_DOCUMENT_TYPES);

  if (!privateR2Client || !PRIVATE_R2_BUCKET) {
    throw new Error("Private document storage is not configured.");
  }

  const filePath = buildDocumentKey(
    "applicationDocument",
    user.id,
    app.id,
    input.filename
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

  const { error: deleteError } = await supabase
    .from("application_documents")
    .delete()
    .eq("application_id", app.id)
    .eq("document_type", input.documentType);

  if (deleteError) throw new Error(deleteError.message);

  const docsTable = supabase.from("application_documents") as any;
  const { error: insertError } = await docsTable.insert({
    application_id: app.id,
    document_type: input.documentType,
    file_path: filePath,
  });

  if (insertError) throw new Error(insertError.message);

  return { success: true as const, filePath };
}

export async function confirmApplicationDocument(input: {
  documentType: DocumentType;
  filePath: string;
}) {
  const { supabase, user } = await getCurrentUserContext();
  const app = await ensureDraftApplication(user.id, undefined, {
    supabase,
    user,
  });

  if (!REQUIRED_DOCUMENTS.some((doc) => doc.type === input.documentType)) {
    throw new Error("Unsupported document type.");
  }

  const { error: deleteError } = await supabase
    .from("application_documents")
    .delete()
    .eq("application_id", app.id)
    .eq("document_type", input.documentType);

  if (deleteError) throw new Error(deleteError.message);

  const payload = {
    application_id: app.id,
    document_type: input.documentType,
    file_path: input.filePath,
  };

  const docsTable = supabase.from("application_documents") as any;

  const { error: insertError } = await docsTable.insert(payload);
  if (insertError) throw new Error(insertError.message);

  return { success: true };
}

export async function markApplicationReadyForReview() {
  const { supabase, user } = await getCurrentUserContext();
  const context = { supabase, user };
  const app = await ensureDraftApplication(user.id, undefined, context);

  const snapshot = await getApplicantDashboardSnapshot({}, context);
  const blocked =
    !snapshot.programmeSelected ||
    !snapshot.personalDetailsComplete ||
    snapshot.uploadedDocuments < snapshot.requiredDocuments ||
    snapshot.paymentStatus !== "successful";

  if (blocked) {
    return {
      success: false,
      issues: [
        {
          field: "review",
          message:
            "Complete programme, personal details, required documents, and payment before submission.",
        },
      ],
    } as const;
  }

  const updatePayload = {
    status: "review",
  };

  const applicationsTable = supabase.from("applications") as any;

  const { error } = await applicationsTable
    .update(updatePayload)
    .eq("id", app.id)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  return { success: true } as const;
}

export async function getProgrammeOptions() {
  return getPostgraduateProgrammeOptions();
}
