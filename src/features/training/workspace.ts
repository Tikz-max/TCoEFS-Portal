import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import JSZip from "jszip";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_DOCUMENT_TYPES,
  buildDocumentKey,
  deleteObject,
  generatePresignedReadUrl,
  validateUpload,
} from "@/lib/storage/upload";
import { PRIVATE_R2_BUCKET, privateR2Client } from "@/lib/storage/r2";
import type { LayoutUser } from "@/components/layout/types";
import type { Database } from "@/types/database.types";
import { getTrainingDashboardSnapshot } from "./index";
import {
  canDeleteTrainingProgramme,
  countPaidRegistrationsByTraining,
} from "./catalogue";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type TrainingApplicationRow = Database["public"]["Tables"]["training_applications"]["Row"];
type TrainingProgramRow = Database["public"]["Tables"]["training_programs"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type TrainingMaterialRow = Database["public"]["Tables"]["training_materials"]["Row"];
type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];

export type TrainingPortalState =
  | "registration_incomplete"
  | "awaiting_payment"
  | "payment_under_review"
  | "payment_rejected"
  | "registration_rejected"
  | "upcoming"
  | "in_progress"
  | "completed"
  | "completed_with_certificate";

export type TrainingScheduleSession = {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  facilitator?: string | null;
};

export type TrainingScheduleDay = {
  id: string;
  dayNumber: number;
  date: string;
  moduleLabel: string;
  topic: string;
  location?: string | null;
  sessions: TrainingScheduleSession[];
};

export type TrainingMaterialPhase = "pre_training" | "session" | "post_training";

export type TrainingMaterialItem = {
  id: string;
  title: string;
  description: string | null;
  phase: TrainingMaterialPhase;
  sessionLabel: string | null;
  materialType: string;
  fileName: string;
  fileSizeBytes: number;
  isPublished: boolean;
  createdAt: string;
};

export type ParticipantRegistrationSummary = {
  applicationId: string;
  trainingId: string;
  title: string;
  scheduleSummary: string | null;
  scheduleRaw: string | null;
  venue: string | null;
  fee: number;
  trainingStatus: TrainingProgramRow["status"];
  paymentStatus: "none" | "pending_receipt" | "pending_approval" | "failed" | "successful";
  paymentId: string | null;
  receiptUploadedAt: string | null;
  adminNotes: string | null;
  portalState: TrainingPortalState;
  enrolledAt: string;
  certificateId: string | null;
  certificateNumber: string | null;
};

export type TrainingWorkspaceSnapshot = {
  user: LayoutUser;
  registrations: ParticipantRegistrationSummary[];
  current: ParticipantRegistrationSummary | null;
  schedule: TrainingScheduleDay[];
  materials: TrainingMaterialItem[];
  filterCounts: Record<string, number>;
};

export type AdminTrainingListItem = {
  id: string;
  title: string;
  slug: string;
  status: TrainingProgramRow["status"];
  venue: string | null;
  fees: number;
   capacity: number | null;
  registrations: number;
  paidRegistrations: number;
  seatsRemaining: number | null;
  materials: number;
  canDelete: boolean;
};

export type AdminTrainingRegistrationItem = {
  id: string;
  trainingId: string;
  trainingTitle: string;
  participantName: string;
  participantEmail: string | null;
  applicationStatus: TrainingApplicationRow["status"];
  paymentStatus: ReturnType<typeof derivePaymentStatus>;
  portalState: TrainingPortalState;
  enrolledAt: string;
  receiptUploadedAt: string | null;
  adminNotes: string | null;
};

export type AdminTrainingDetail = {
  training: {
    id: string;
    title: string;
    slug: string;
    description: string;
    status: TrainingProgramRow["status"];
    venue: string | null;
    fees: number;
    capacity: number | null;
    breadcrumbLabel: string | null;
    categoryLabel: string | null;
    modeLabel: string | null;
    durationLabel: string | null;
    feeSubLabel: string | null;
    registrationDeadline: string | null;
    outcomes: string[];
    audience: string[];
    contactEmail: string | null;
    contactPhone: string | null;
    feeType: "single" | "tiered";
    feeTiers: Array<{ label: string; amount: number }>;
    schedule: TrainingScheduleDay[];
  };
  paidRegistrations: number;
  canDelete: boolean;
  materials: TrainingMaterialItem[];
  registrations: Array<{
    id: string;
    participantName: string;
    email: string | null;
    applicationStatus: TrainingApplicationRow["status"];
    paymentStatus: string;
    portalState: TrainingPortalState;
  }>;
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseSchedule(raw: string | null): TrainingScheduleDay[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as TrainingScheduleDay[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function scheduleSummaryFromRaw(raw: string | null) {
  const parsed = parseSchedule(raw);
  if (parsed.length === 0) return null;
  return `${parsed.length} day schedule published`;
}

function serializeSchedule(days: TrainingScheduleDay[]) {
  return JSON.stringify(days);
}

function derivePaymentStatus(payment: PaymentRow | null) {
  if (!payment) return "none" as const;
  if (payment.status === "successful") return "successful" as const;
  if (payment.status === "failed") return "failed" as const;
  if (payment.receipt_uploaded_at || payment.receipt_storage_path) {
    return "pending_approval" as const;
  }
  return "pending_receipt" as const;
}

function derivePortalState(input: {
  appStatus: TrainingApplicationRow["status"];
  paymentStatus: ReturnType<typeof derivePaymentStatus>;
  trainingStatus: TrainingProgramRow["status"];
  certificate: CertificateRow | null;
}) {
  if (input.appStatus === "rejected") return "registration_rejected" as const;
  if (input.paymentStatus === "failed") return "payment_rejected" as const;
  if (input.paymentStatus === "none" || input.paymentStatus === "pending_receipt") {
    return input.appStatus === "pending"
      ? ("registration_incomplete" as const)
      : ("awaiting_payment" as const);
  }
  if (input.paymentStatus === "pending_approval") return "payment_under_review" as const;
  if (input.appStatus !== "approved") return "payment_under_review" as const;
  if (input.trainingStatus === "completed") {
    return input.certificate ? "completed_with_certificate" : "completed";
  }
  if (input.trainingStatus === "in_progress") return "in_progress" as const;
  return "upcoming" as const;
}

function stateRank(state: TrainingPortalState) {
  if (state === "registration_incomplete") return 0;
  if (state === "awaiting_payment") return 1;
  if (state === "payment_under_review") return 2;
  if (state === "payment_rejected") return 3;
  if (state === "registration_rejected") return 4;
  if (state === "upcoming") return 5;
  if (state === "in_progress") return 6;
  if (state === "completed") return 7;
  return 8;
}

function isMissingTrainingMaterialsTable(error: { message?: string } | null | undefined) {
  return Boolean(
    error?.message?.includes("Could not find the table 'public.training_materials'")
  );
}

async function getCurrentUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("UNAUTHENTICATED");
  const profileResp = await (supabase.from("profiles") as any)
    .select("first_name,last_name,role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileResp.error) throw new Error(profileResp.error.message);
  return { user, profile: (profileResp.data as Pick<ProfileRow, "first_name" | "last_name" | "role"> | null) || null };
}

async function getTrainingAdminContext() {
  const context = await getCurrentUserContext();
  const role = context.profile?.role;
  if (role !== "training_coordinator" && role !== "admin" && role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }
  return context;
}

async function getTrainingSuperAdminContext() {
  const context = await getCurrentUserContext();
  if (context.profile?.role !== "super_admin" && context.profile?.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return context;
}

export async function getTrainingParticipantLayoutUser(): Promise<LayoutUser> {
  const { user, profile } = await getCurrentUserContext();
  const name = profile ? `${profile.first_name} ${profile.last_name}`.trim() : user.email || "Participant";
  return {
    name,
    initials: initialsFromName(name),
    role: "training_participant",
    roleLabel: "Training Participant",
  };
}

export async function getTrainingAdminLayoutUser(): Promise<LayoutUser> {
  const { user, profile } = await getTrainingAdminContext();
  const name = profile ? `${profile.first_name} ${profile.last_name}`.trim() : user.email || "Training Coordinator";
  const role = profile?.role === "super_admin" ? "super_admin" : profile?.role === "admin" ? "admin" : "training_coordinator";
  return {
    name,
    initials: initialsFromName(name),
    role,
    roleLabel: role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Training Coordinator",
  };
}

async function getParticipantRegistrationSummaries(userId: string): Promise<ParticipantRegistrationSummary[]> {
  const appsResp = await adminClient
    .from("training_applications")
    .select("*")
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false });
  if (appsResp.error) throw new Error(appsResp.error.message);
  const applications = (appsResp.data || []) as TrainingApplicationRow[];
  if (applications.length === 0) return [];

  const trainingIds = Array.from(new Set(applications.map((app) => app.training_id)));
  const [programmesResp, paymentsResp, certsResp] = await Promise.all([
    adminClient.from("training_programs").select("*").in("id", trainingIds),
    adminClient
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("entity_type", "training_application")
      .in("entity_id", applications.map((app) => app.id)),
    adminClient.from("certificates").select("*").eq("user_id", userId).in("course_id", trainingIds),
  ]);

  if (programmesResp.error) throw new Error(programmesResp.error.message);
  if (paymentsResp.error) throw new Error(paymentsResp.error.message);
  if (certsResp.error) throw new Error(certsResp.error.message);

  const programmes = new Map(
    (((programmesResp.data || []) as TrainingProgramRow[]).map((row) => [row.id, row]))
  );
  const payments = new Map<string, PaymentRow>();
  for (const row of ((paymentsResp.data || []) as PaymentRow[]).sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    if (!payments.has(row.entity_id)) payments.set(row.entity_id, row);
  }
  const certificates = new Map(((certsResp.data || []) as CertificateRow[]).map((row) => [row.course_id, row]));

  const summaries = applications
    .map((app) => {
      const programme = programmes.get(app.training_id);
      if (!programme) return null;
      const payment = payments.get(app.id) || null;
      const paymentStatus = derivePaymentStatus(payment);
      const certificate = certificates.get(programme.id) || null;
      return {
        applicationId: app.id,
        trainingId: programme.id,
        title: programme.title,
        scheduleSummary: scheduleSummaryFromRaw(programme.schedule),
        scheduleRaw: programme.schedule,
        venue: programme.venue,
        fee: toNumber(programme.fees),
        trainingStatus: programme.status,
        paymentStatus,
        paymentId: payment?.id || null,
        receiptUploadedAt: payment?.receipt_uploaded_at || null,
        adminNotes: app.admin_notes || payment?.admin_notes || null,
        portalState: derivePortalState({
          appStatus: app.status,
          paymentStatus,
          trainingStatus: programme.status,
          certificate,
        }),
        enrolledAt: app.enrolled_at,
        certificateId: certificate?.id || null,
        certificateNumber: certificate?.certificate_number || null,
      } satisfies ParticipantRegistrationSummary;
    })
    .filter(Boolean) as ParticipantRegistrationSummary[];

  summaries.sort((a, b) => {
    const rankDiff = stateRank(a.portalState) - stateRank(b.portalState);
    if (rankDiff !== 0) return rankDiff;
    return b.enrolledAt.localeCompare(a.enrolledAt);
  });

  return summaries;
}

function pickCurrentRegistration(
  registrations: ParticipantRegistrationSummary[],
  registrationId?: string | null
) {
  if (registrationId) {
    const match = registrations.find((item) => item.applicationId === registrationId);
    if (match) return match;
  }
  return registrations[0] || null;
}

async function getTrainingMaterialsForTraining(trainingId: string) {
  const resp = await adminClient
    .from("training_materials")
    .select("*")
    .eq("training_id", trainingId)
    .eq("is_published", true)
    .order("phase", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (resp.error) {
    if (isMissingTrainingMaterialsTable(resp.error)) return [];
    throw new Error(resp.error.message);
  }
  return ((resp.data || []) as TrainingMaterialRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    phase: row.phase,
    sessionLabel: row.session_label,
    materialType: row.material_type,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    isPublished: row.is_published,
    createdAt: row.created_at,
  } satisfies TrainingMaterialItem));
}

export async function getTrainingWorkspaceSnapshot(options: {
  registrationId?: string | null;
  materialType?: string | null;
} = {}): Promise<TrainingWorkspaceSnapshot> {
  const [{ user }, layoutUser] = await Promise.all([
    getCurrentUserContext(),
    getTrainingParticipantLayoutUser(),
  ]);
  const registrations = await getParticipantRegistrationSummaries(user.id);
  const current = pickCurrentRegistration(registrations, options.registrationId || null);
  const schedule = current ? parseSchedule(current.scheduleRaw) : [];
  const allMaterials = current ? await getTrainingMaterialsForTraining(current.trainingId) : [];
  const filterCounts = allMaterials.reduce<Record<string, number>>((acc, item) => {
    acc[item.materialType] = (acc[item.materialType] || 0) + 1;
    return acc;
  }, {});
  const filteredMaterials =
    options.materialType && options.materialType !== "All"
      ? allMaterials.filter((item) => item.materialType === options.materialType)
      : allMaterials;

  return {
    user: layoutUser,
    registrations,
    current,
    schedule,
    materials: filteredMaterials,
    filterCounts,
  };
}

async function assertParticipantMaterialAccess(materialId: string, registrationId?: string | null) {
  const { user } = await getCurrentUserContext();
  const registrations = await getParticipantRegistrationSummaries(user.id);
  const current = pickCurrentRegistration(registrations, registrationId || null);
  if (!current) throw new Error("FORBIDDEN");

  const materialResp = await adminClient
    .from("training_materials")
    .select("*")
    .eq("id", materialId)
    .eq("training_id", current.trainingId)
    .eq("is_published", true)
    .maybeSingle();

  if (materialResp.error) {
    if (isMissingTrainingMaterialsTable(materialResp.error)) throw new Error("NOT_FOUND");
    throw new Error(materialResp.error.message);
  }
  if (!materialResp.data) throw new Error("NOT_FOUND");
  return materialResp.data as TrainingMaterialRow;
}

export async function getTrainingMaterialDownloadUrl(materialId: string, registrationId?: string | null) {
  const material = await assertParticipantMaterialAccess(materialId, registrationId || null);
  return generatePresignedReadUrl({ key: material.storage_path, expiresIn: 300 });
}

export async function buildTrainingMaterialsZip(registrationId?: string | null) {
  const { user } = await getCurrentUserContext();
  const registrations = await getParticipantRegistrationSummaries(user.id);
  const current = pickCurrentRegistration(registrations, registrationId || null);
  if (!current) throw new Error("NOT_FOUND");
  const materialsResp = await adminClient
    .from("training_materials")
    .select("*")
    .eq("training_id", current.trainingId)
    .eq("is_published", true)
    .order("phase", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (materialsResp.error) {
    if (isMissingTrainingMaterialsTable(materialsResp.error)) {
      return {
        fileName: `${current.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-materials.zip`,
        content: await new JSZip().generateAsync({ type: "uint8array" }),
      };
    }
    throw new Error(materialsResp.error.message);
  }

  if (!privateR2Client || !PRIVATE_R2_BUCKET) {
    throw new Error("Private document storage is not configured.");
  }

  const zip = new JSZip();
  for (const material of (materialsResp.data || []) as TrainingMaterialRow[]) {
    const object = await privateR2Client.send(
      new GetObjectCommand({ Bucket: PRIVATE_R2_BUCKET, Key: material.storage_path })
    );
    const bytes = await object.Body?.transformToByteArray();
    if (!bytes) continue;
    const folder = material.phase === "session" ? `session/${material.session_label || "general"}` : material.phase;
    zip.file(`${folder}/${material.file_name}`, bytes);
  }

  const content = await zip.generateAsync({ type: "uint8array" });
  return {
    fileName: `${current.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-materials.zip`,
    content,
  };
}

export async function getAdminTrainingList(): Promise<AdminTrainingListItem[]> {
  await getTrainingAdminContext();
  const [trainingResp, appResp, materialsResp, paymentsResp] = await Promise.all([
    adminClient.from("training_programs").select("*").order("created_at", { ascending: false }),
    adminClient.from("training_applications").select("id,training_id"),
    adminClient.from("training_materials").select("id,training_id"),
    adminClient
      .from("payments")
      .select("entity_id,status")
      .eq("entity_type", "training_application")
      .eq("status", "successful"),
  ]);

  if (trainingResp.error) throw new Error(trainingResp.error.message);
  if (appResp.error) throw new Error(appResp.error.message);
  if (materialsResp.error && !isMissingTrainingMaterialsTable(materialsResp.error)) {
    throw new Error(materialsResp.error.message);
  }
  if (paymentsResp.error) throw new Error(paymentsResp.error.message);

  const registrationCounts = new Map<string, number>();
  for (const row of (appResp.data || []) as Array<Pick<TrainingApplicationRow, "training_id">>) {
    registrationCounts.set(row.training_id, (registrationCounts.get(row.training_id) || 0) + 1);
  }
  const materialCounts = new Map<string, number>();
  for (const row of ((materialsResp.data || []) as Array<Pick<TrainingMaterialRow, "training_id">>)) {
    materialCounts.set(row.training_id, (materialCounts.get(row.training_id) || 0) + 1);
  }
  const trainingByApplication = new Map(
    ((appResp.data || []) as Array<Pick<TrainingApplicationRow, "id" | "training_id">>).map((row) => [row.id, row.training_id])
  );
  const paidCounts = countPaidRegistrationsByTraining(
    ((paymentsResp.data || []) as Array<Pick<PaymentRow, "entity_id">>)
      .map((row) => {
        const trainingId = trainingByApplication.get(row.entity_id);
        return trainingId
          ? { trainingId, applicationId: row.entity_id }
          : null;
      })
      .filter((item): item is { trainingId: string; applicationId: string } => Boolean(item))
  );

  return ((trainingResp.data || []) as TrainingProgramRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    venue: row.venue,
    fees: toNumber(row.fees),
    capacity: row.capacity,
    registrations: registrationCounts.get(row.id) || 0,
    paidRegistrations: paidCounts.get(row.id) || 0,
    seatsRemaining:
      typeof row.capacity === "number"
        ? Math.max(row.capacity - (paidCounts.get(row.id) || 0), 0)
        : null,
    materials: materialCounts.get(row.id) || 0,
    canDelete: canDeleteTrainingProgramme(registrationCounts.get(row.id) || 0),
  }));
}

export async function getAdminTrainingRegistrations(): Promise<AdminTrainingRegistrationItem[]> {
  await getTrainingAdminContext();

  const [appsResp, trainingsResp] = await Promise.all([
    adminClient
      .from("training_applications")
      .select("*")
      .order("enrolled_at", { ascending: false }),
    adminClient.from("training_programs").select("id,title,status"),
  ]);

  if (appsResp.error) throw new Error(appsResp.error.message);
  if (trainingsResp.error) throw new Error(trainingsResp.error.message);

  const apps = (appsResp.data || []) as TrainingApplicationRow[];
  if (apps.length === 0) return [];

  const userIds = Array.from(new Set(apps.map((app) => app.user_id)));
  const appIds = apps.map((app) => app.id);

  const [profilesResp, paymentsResp, usersResp] = await Promise.all([
    adminClient
      .from("profiles")
      .select("user_id,first_name,last_name")
      .in("user_id", userIds),
    adminClient
      .from("payments")
      .select("*")
      .eq("entity_type", "training_application")
      .in("entity_id", appIds),
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profilesResp.error) throw new Error(profilesResp.error.message);
  if (paymentsResp.error) throw new Error(paymentsResp.error.message);

  const profileMap = new Map(
    ((profilesResp.data || []) as Array<Pick<ProfileRow, "user_id" | "first_name" | "last_name">>).map((row) => [
      row.user_id,
      `${row.first_name} ${row.last_name}`.trim(),
    ])
  );
  const emailMap = new Map((usersResp.data?.users || []).map((user) => [user.id, user.email || null]));
  const trainingMap = new Map(
    ((trainingsResp.data || []) as Array<Pick<TrainingProgramRow, "id" | "title" | "status">>).map((row) => [
      row.id,
      { title: row.title, status: row.status },
    ])
  );
  const paymentMap = new Map<string, PaymentRow>();
  for (const row of ((paymentsResp.data || []) as PaymentRow[]).sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    if (!paymentMap.has(row.entity_id)) paymentMap.set(row.entity_id, row);
  }

  return apps.map((app) => {
    const training = trainingMap.get(app.training_id);
    const payment = paymentMap.get(app.id) || null;
    const paymentStatus = derivePaymentStatus(payment);
    return {
      id: app.id,
      trainingId: app.training_id,
      trainingTitle: training?.title || "Training programme",
      participantName: profileMap.get(app.user_id) || "Participant",
      participantEmail: emailMap.get(app.user_id) || null,
      applicationStatus: app.status,
      paymentStatus,
      portalState: derivePortalState({
        appStatus: app.status,
        paymentStatus,
        trainingStatus: training?.status || "published",
        certificate: null,
      }),
      enrolledAt: app.enrolled_at,
      receiptUploadedAt: payment?.receipt_uploaded_at || null,
      adminNotes: app.admin_notes || null,
    };
  });
}

export async function getAdminTrainingDetail(trainingId: string): Promise<AdminTrainingDetail> {
  await getTrainingAdminContext();
  const [trainingResp, materialResp, appResp] = await Promise.all([
    adminClient.from("training_programs").select("*").eq("id", trainingId).maybeSingle(),
    adminClient
      .from("training_materials")
      .select("*")
      .eq("training_id", trainingId)
      .order("phase", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    adminClient.from("training_applications").select("*").eq("training_id", trainingId),
  ]);

  if (trainingResp.error) throw new Error(trainingResp.error.message);
  if (materialResp.error && !isMissingTrainingMaterialsTable(materialResp.error)) {
    throw new Error(materialResp.error.message);
  }
  if (appResp.error) throw new Error(appResp.error.message);
  if (!trainingResp.data) throw new Error("NOT_FOUND");

  const apps = (appResp.data || []) as TrainingApplicationRow[];
  const userIds = Array.from(new Set(apps.map((app) => app.user_id)));
  const [profilesResp, paymentsResp, certsResp] = await Promise.all([
    userIds.length > 0
      ? adminClient.from("profiles").select("user_id,first_name,last_name").in("user_id", userIds)
      : Promise.resolve({ data: [], error: null } as any),
    apps.length > 0
      ? adminClient.from("payments").select("*").eq("entity_type", "training_application").in("entity_id", apps.map((app) => app.id))
      : Promise.resolve({ data: [], error: null } as any),
    adminClient.from("certificates").select("*").eq("course_id", trainingId),
  ]);

  if (profilesResp.error) throw new Error(profilesResp.error.message);
  if (paymentsResp.error) throw new Error(paymentsResp.error.message);
  if (certsResp.error) throw new Error(certsResp.error.message);

  const profileMap = new Map(((profilesResp.data || []) as Array<Pick<ProfileRow, "user_id" | "first_name" | "last_name">>).map((row) => [row.user_id, `${row.first_name} ${row.last_name}`.trim()]));
  const paymentMap = new Map<string, PaymentRow>();
  for (const row of ((paymentsResp.data || []) as PaymentRow[]).sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    if (!paymentMap.has(row.entity_id)) paymentMap.set(row.entity_id, row);
  }
  const certMap = new Map(((certsResp.data || []) as CertificateRow[]).map((row) => [row.user_id, row]));
  const training = trainingResp.data as TrainingProgramRow;
  const paidRegistrations = countPaidRegistrationsByTraining(
    ((paymentsResp.data || []) as PaymentRow[])
      .filter((row) => row.status === "successful")
      .map((row) => ({ trainingId, applicationId: row.entity_id }))
  ).get(trainingId) || 0;

  return {
    training: {
      id: training.id,
      title: training.title,
      slug: training.slug,
      description: training.description,
      status: training.status,
      venue: training.venue,
      fees: toNumber(training.fees),
      capacity: training.capacity,
      breadcrumbLabel: training.breadcrumb_label,
      categoryLabel: training.category_label,
      modeLabel: training.mode_label,
      durationLabel: training.duration_label,
      feeSubLabel: training.fee_sub_label,
      registrationDeadline: training.registration_deadline,
      outcomes: training.outcomes || [],
      audience: training.audience || [],
      contactEmail: training.contact_email,
      contactPhone: training.contact_phone,
      feeType: (training.fee_type as "single" | "tiered") || "single",
      feeTiers: Array.isArray(training.fee_tiers) ? training.fee_tiers : [],
      schedule: parseSchedule(training.schedule),
    },
    paidRegistrations,
    canDelete: canDeleteTrainingProgramme(apps.length),
    materials: ((materialResp.data || []) as TrainingMaterialRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      phase: row.phase,
      sessionLabel: row.session_label,
      materialType: row.material_type,
      fileName: row.file_name,
      fileSizeBytes: row.file_size_bytes,
      isPublished: row.is_published,
      createdAt: row.created_at,
    })),
    registrations: apps.map((app) => {
      const paymentStatus = derivePaymentStatus(paymentMap.get(app.id) || null);
      const certificate = certMap.get(app.user_id) || null;
      return {
        id: app.id,
        participantName: profileMap.get(app.user_id) || "Participant",
        email: null,
        applicationStatus: app.status,
        paymentStatus,
        portalState: derivePortalState({
          appStatus: app.status,
          paymentStatus,
          trainingStatus: training.status,
          certificate,
        }),
      };
    }),
  };
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTrainingProgrammeInput(input: {
  title?: string;
  slug?: string;
  description?: string;
  venue?: string | null;
  fees?: number;
  capacity?: number | null;
  status?: TrainingProgramRow["status"];
  breadcrumbLabel?: string | null;
  categoryLabel?: string | null;
  modeLabel?: string | null;
  durationLabel?: string | null;
  feeSubLabel?: string | null;
  registrationDeadline?: string | null;
  outcomes?: string[];
  audience?: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  feeType?: "single" | "tiered";
  feeTiers?: Array<{ label: string; amount: number }>;
}) {
  const title = input.title?.trim() || "";
  const slug = normalizeSlug(input.slug || input.title || "");
  const description = input.description?.trim() || "";
  const fees = toNumber(input.fees);
  const capacity = input.capacity == null ? null : Math.max(Math.floor(toNumber(input.capacity)), 0);
  const venue = input.venue?.trim() || null;
  const status = input.status || "draft";
  const breadcrumbLabel = input.breadcrumbLabel?.trim() || null;
  const categoryLabel = input.categoryLabel?.trim() || null;
  const modeLabel = input.modeLabel?.trim() || null;
  const durationLabel = input.durationLabel?.trim() || null;
  const feeSubLabel = input.feeSubLabel?.trim() || null;
  const registrationDeadline = input.registrationDeadline?.trim() || null;
  const outcomes = (input.outcomes || []).map((item) => item.trim()).filter(Boolean);
  const audience = (input.audience || []).map((item) => item.trim()).filter(Boolean);
  const contactEmail = input.contactEmail?.trim() || null;
  const contactPhone = input.contactPhone?.trim() || null;
  const feeType = input.feeType || "single";
  const feeTiers = (input.feeTiers || []).filter((t) => t.label && t.amount > 0);

  if (!title) throw new Error("Programme title is required.");
  if (!slug) throw new Error("Programme slug is required.");
  if (!description) throw new Error("Programme overview is required.");
  if (fees < 0) throw new Error("Programme fee cannot be negative.");

  return {
    title,
    slug,
    description,
    fees,
    capacity,
    venue,
    status,
    breadcrumbLabel,
    categoryLabel,
    modeLabel,
    durationLabel,
    feeSubLabel,
    registrationDeadline,
    outcomes,
    audience,
    contactEmail,
    contactPhone,
    feeType,
    feeTiers,
  };
}

export async function createAdminTrainingProgramme(input: {
  title: string;
  slug?: string;
  description: string;
  venue?: string | null;
  fees: number;
  capacity?: number | null;
  status?: TrainingProgramRow["status"];
  breadcrumbLabel?: string | null;
  categoryLabel?: string | null;
  modeLabel?: string | null;
  durationLabel?: string | null;
  feeSubLabel?: string | null;
  registrationDeadline?: string | null;
  outcomes?: string[];
  audience?: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
}) {
  const { user } = await getTrainingSuperAdminContext();
  const normalized = normalizeTrainingProgrammeInput(input);

  const existing = await adminClient
    .from("training_programs")
    .select("id")
    .eq("slug", normalized.slug)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) throw new Error("A training programme with this slug already exists.");

  const { data, error } = await (adminClient.from("training_programs") as any)
    .insert({
      title: normalized.title,
      slug: normalized.slug,
      description: normalized.description,
      venue: normalized.venue,
      fees: normalized.fees,
      capacity: normalized.capacity,
      status: normalized.status,
      breadcrumb_label: normalized.breadcrumbLabel,
      category_label: normalized.categoryLabel,
      mode_label: normalized.modeLabel,
      duration_label: normalized.durationLabel,
      fee_sub_label: normalized.feeSubLabel,
      registration_deadline: normalized.registrationDeadline,
      outcomes: normalized.outcomes,
      audience: normalized.audience,
      contact_email: normalized.contactEmail,
      contact_phone: normalized.contactPhone,
      creator_id: user.id,
      schedule: null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message || "Could not create training programme.");
  return { success: true as const, id: data.id as string };
}

export async function updateAdminTrainingProgramme(
  trainingId: string,
  input: {
    title?: string;
    slug?: string;
    description?: string;
    venue?: string | null;
    fees?: number;
    capacity?: number | null;
    status?: TrainingProgramRow["status"];
    breadcrumbLabel?: string | null;
    categoryLabel?: string | null;
    modeLabel?: string | null;
    durationLabel?: string | null;
    feeSubLabel?: string | null;
    registrationDeadline?: string | null;
    outcomes?: string[];
    audience?: string[];
    contactEmail?: string | null;
    contactPhone?: string | null;
    feeType?: "single" | "tiered";
    feeTiers?: Array<{ label: string; amount: number }>;
  }
) {
  await getTrainingSuperAdminContext();
  const currentResp = await adminClient
    .from("training_programs")
    .select("*")
    .eq("id", trainingId)
    .maybeSingle();
  if (currentResp.error) throw new Error(currentResp.error.message);
  if (!currentResp.data) throw new Error("NOT_FOUND");

  const current = currentResp.data as TrainingProgramRow;
  const normalized = normalizeTrainingProgrammeInput({
    title: input.title ?? current.title,
    slug: input.slug ?? current.slug,
    description: input.description ?? current.description,
    venue: input.venue ?? current.venue,
    fees: input.fees ?? toNumber(current.fees),
    capacity: input.capacity ?? current.capacity,
    status: input.status ?? current.status,
    breadcrumbLabel: input.breadcrumbLabel ?? current.breadcrumb_label,
    categoryLabel: input.categoryLabel ?? current.category_label,
    modeLabel: input.modeLabel ?? current.mode_label,
    durationLabel: input.durationLabel ?? current.duration_label,
    feeSubLabel: input.feeSubLabel ?? current.fee_sub_label,
    registrationDeadline: input.registrationDeadline ?? current.registration_deadline,
    outcomes: input.outcomes ?? current.outcomes,
    audience: input.audience ?? current.audience,
    contactEmail: input.contactEmail ?? current.contact_email,
    contactPhone: input.contactPhone ?? current.contact_phone,
  });

  const existing = await adminClient
    .from("training_programs")
    .select("id")
    .eq("slug", normalized.slug)
    .neq("id", trainingId)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) throw new Error("A training programme with this slug already exists.");

  const { error } = await (adminClient.from("training_programs") as any)
    .update({
      title: normalized.title,
      slug: normalized.slug,
      description: normalized.description,
      venue: normalized.venue,
      fees: normalized.fees,
      capacity: normalized.capacity,
      status: normalized.status,
      breadcrumb_label: normalized.breadcrumbLabel,
      category_label: normalized.categoryLabel,
      mode_label: normalized.modeLabel,
      duration_label: normalized.durationLabel,
      fee_sub_label: normalized.feeSubLabel,
      registration_deadline: normalized.registrationDeadline,
      outcomes: normalized.outcomes,
      audience: normalized.audience,
      contact_email: normalized.contactEmail,
      contact_phone: normalized.contactPhone,
      fee_type: normalized.feeType,
      fee_tiers: normalized.feeTiers,
    })
    .eq("id", trainingId);
  if (error) throw new Error(error.message);
  return { success: true as const };
}

export async function deleteAdminTrainingProgramme(trainingId: string) {
  await getTrainingSuperAdminContext();
  const appsResp = await adminClient
    .from("training_applications")
    .select("id")
    .eq("training_id", trainingId);
  if (appsResp.error) throw new Error(appsResp.error.message);
  if (!canDeleteTrainingProgramme((appsResp.data || []).length)) {
    throw new Error("HAS_REGISTRATIONS");
  }

  const { error } = await adminClient.from("training_programs").delete().eq("id", trainingId);
  if (error) throw new Error(error.message);
  return { success: true as const };
}

export async function saveAdminTrainingSchedule(trainingId: string, schedule: TrainingScheduleDay[]) {
  await getTrainingAdminContext();
  const { error } = await (adminClient.from("training_programs") as any)
    .update({ schedule: serializeSchedule(schedule) })
    .eq("id", trainingId);

  if (error) throw new Error(error.message);
  return { success: true as const };
}

export async function uploadAdminTrainingMaterialFile(input: {
  trainingId: string;
  title: string;
  description?: string;
  phase: TrainingMaterialPhase;
  sessionLabel?: string;
  materialType: string;
  sortOrder?: number;
  filename: string;
  contentType: string;
  contentLength: number;
  data: Uint8Array;
}) {
  const { user } = await getTrainingAdminContext();
  validateUpload(input.contentType, input.contentLength, ALLOWED_DOCUMENT_TYPES);

  if (!privateR2Client || !PRIVATE_R2_BUCKET) {
    throw new Error("Private document storage is not configured.");
  }

  const filePath = buildDocumentKey("trainingDocument", user.id, input.trainingId, input.filename);
  await privateR2Client.send(
    new PutObjectCommand({
      Bucket: PRIVATE_R2_BUCKET,
      Key: filePath,
      Body: input.data,
      ContentType: input.contentType,
      ContentLength: input.contentLength,
    })
  );

  const { data, error } = await (adminClient.from("training_materials") as any)
    .insert({
      training_id: input.trainingId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      phase: input.phase,
      session_label: input.sessionLabel?.trim() || null,
      material_type: input.materialType.trim() || "Document",
      file_name: input.filename,
      file_size_bytes: input.contentLength,
      storage_path: filePath,
      is_published: true,
      sort_order: input.sortOrder || 0,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Could not create training material.");

  return data as TrainingMaterialRow;
}

export async function deleteAdminTrainingMaterial(materialId: string) {
  await getTrainingAdminContext();
  const resp = await adminClient.from("training_materials").select("*").eq("id", materialId).maybeSingle();
  if (resp.error) throw new Error(resp.error.message);
  if (!resp.data) throw new Error("NOT_FOUND");

  await deleteObject((resp.data as TrainingMaterialRow).storage_path);
  const { error } = await adminClient.from("training_materials").delete().eq("id", materialId);
  if (error) throw new Error(error.message);
  return { success: true as const };
}

export async function getTrainingDashboardPortalData(options: { registrationId?: string | null } = {}) {
  const [layoutUser, workspace, dashboardSnapshot] = await Promise.all([
    getTrainingParticipantLayoutUser(),
    getTrainingWorkspaceSnapshot({ registrationId: options.registrationId || null }),
    getTrainingDashboardSnapshot(),
  ]);

  return {
    user: layoutUser,
    workspace,
    dashboardSnapshot,
  };
}
