import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getBankTransferConfig } from "@/features/payments";
import type { Database } from "@/types/database.types";
import { getTrainingProgress, type TrainingPaymentStatus } from "./progress";
import {
  TRAINING_PROGRAMMES_FALLBACK,
  type TrainingProgrammeFallback,
} from "./catalogue-fallback";

type TrainingProgramRow = Database["public"]["Tables"]["training_programs"]["Row"];
type TrainingApplicationRow = Database["public"]["Tables"]["training_applications"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

export type TrainingDashboardState =
  | "start"
  | "profile_pending"
  | "documents_pending"
  | "payment_required"
  | "payment_pending"
  | "payment_rejected"
  | "approved";

export const TRAINING_REQUIRED_DOCUMENTS = [
  { id: "passport_photo", label: "Passport Photograph" },
  { id: "id_card", label: "Valid ID Card" },
  { id: "consent_form", label: "Signed Training Consent" },
] as const;

export type TrainingDocumentId = (typeof TRAINING_REQUIRED_DOCUMENTS)[number]["id"];

export interface TrainingProgrammeOption {
  id: string;
  title: string;
  slug: string;
  fees: number;
  schedule: string | null;
  venue: string | null;
}

export interface TrainingChecklistItem {
  id: TrainingDocumentId;
  label: string;
  completed: boolean;
}

export interface TrainingRegistrationSnapshot {
  name: string;
  initials: string;
  applicationId: string | null;
  programmeLabel: string;
  programmeSlug: string;
  programmeSelected: boolean;
  programmeFee: number | null;
  venue: string | null;
  schedule: string | null;
  personalDetailsComplete: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  documentsComplete: boolean;
  paymentStatus: TrainingPaymentStatus;
  paymentId: string | null;
  paymentAmount: number | null;
  receiptUploadedAt: string | null;
  adminNotes: string | null;
  currentStep: number;
  maxAllowedStep: number;
}

export interface TrainingRegistrationPayload {
  snapshot: TrainingRegistrationSnapshot;
  programmes: TrainingProgrammeOption[];
  checklist: {
    items: TrainingChecklistItem[];
    uploadedCount: number;
    requiredCount: number;
    complete: boolean;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    instructions?: string;
    amount: number;
  };
}

export interface TrainingDashboardSnapshot {
  participantName: string;
  participantInitials: string;
  state: TrainingDashboardState;
  profileComplete: boolean;
  checklist: TrainingChecklistItem[];
  applicationId: string | null;
  programmeTitle: string | null;
  programmeSlug: string | null;
  programmeFee: number | null;
  venue: string | null;
  schedule: string | null;
  applicationStatus: Database["public"]["Enums"]["application_status"] | null;
  paymentStatus: TrainingPaymentStatus;
  paymentId: string | null;
  receiptUploadedAt: string | null;
  adminNotes: string | null;
}

const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function fullName(profile: Pick<ProfileRow, "first_name" | "last_name"> | null, email: string | null) {
  if (profile) return `${profile.first_name} ${profile.last_name}`.trim();
  return email || "Training Participant";
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function hasMinLength(value: string | null | undefined, min: number) {
  return Boolean(value && value.trim().length >= min);
}

function checkProfileCompleteness(profile: Pick<ProfileRow, "first_name" | "last_name" | "phone"> | null) {
  if (!profile) return false;
  return (
    hasMinLength(profile.first_name, 2) &&
    hasMinLength(profile.last_name, 2) &&
    hasMinLength(profile.phone, 10) &&
    PHONE_PATTERN.test(profile.phone || "")
  );
}

function derivePaymentStatus(payment: PaymentRow | null): TrainingPaymentStatus {
  if (!payment) return "none";
  if (payment.status === "successful") return "successful";
  if (payment.status === "failed") return "failed";
  if (payment.receipt_uploaded_at || payment.receipt_storage_path) return "pending_approval";
  return "pending_receipt";
}

function documentsCompleteFromApplication(application: TrainingApplicationRow | null) {
  return application?.status === "review" || application?.status === "approved";
}

function resolveDashboardState(snapshot: TrainingRegistrationSnapshot): TrainingDashboardState {
  if (!snapshot.applicationId) return "start";
  if (!snapshot.personalDetailsComplete) return "profile_pending";
  if (!snapshot.documentsComplete) return "documents_pending";
  if (snapshot.paymentStatus === "failed") return "payment_rejected";
  if (snapshot.paymentStatus === "pending_approval") return "payment_pending";
  if (snapshot.paymentStatus === "successful") return "approved";
  return "payment_required";
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

function mapFallbackProgramme(row: TrainingProgrammeFallback): TrainingProgrammeOption {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    fees: row.fees,
    schedule: row.schedule,
    venue: row.venue,
  };
}

export async function getTrainingProgrammeOptions(): Promise<TrainingProgrammeOption[]> {
  const supabase = await createClient();
  const trainingTable = supabase.from("training_programs") as any;
  const { data, error } = await trainingTable
    .select("id,title,slug,fees,schedule,venue")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data || []) as Array<Pick<TrainingProgramRow, "id" | "title" | "slug" | "fees" | "schedule" | "venue">>;
  if (rows.length > 0) {
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      fees: toNumber(row.fees),
      schedule: row.schedule,
      venue: row.venue,
    }));
  }

  return TRAINING_PROGRAMMES_FALLBACK.map(mapFallbackProgramme);
}

async function getLatestTrainingApplication(userId: string, context?: UserContext) {
  const supabase = context?.supabase || (await getCurrentUserContext()).supabase;
  const appsTable = supabase.from("training_applications") as any;
  const { data, error } = await appsTable
    .select("*")
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as TrainingApplicationRow | null) || null;
}

async function getTrainingApplicationByIdForUser(
  userId: string,
  applicationId: string,
  context?: UserContext
) {
  const supabase = context?.supabase || (await getCurrentUserContext()).supabase;
  const appsTable = supabase.from("training_applications") as any;
  const { data, error } = await appsTable
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as TrainingApplicationRow | null) || null;
}

async function getProgrammeBySlug(slug: string) {
  const programmes = await getTrainingProgrammeOptions();
  const programme = programmes.find((item) => item.slug === slug);
  if (!programme) throw new Error("Invalid training programme selected.");
  return programme;
}

async function ensurePersistentProgrammeRecord(
  programme: TrainingProgrammeOption,
  creatorId: string
) {
  const trainingTable = adminClient.from("training_programs") as any;
  const { data: existing, error: lookupError } = await trainingTable
    .select("id,title,slug,fees,schedule,venue")
    .eq("slug", programme.slug)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (existing) {
    const row = existing as Pick<TrainingProgramRow, "id" | "title" | "slug" | "fees" | "schedule" | "venue">;
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      fees: toNumber(row.fees),
      schedule: row.schedule,
      venue: row.venue,
    } satisfies TrainingProgrammeOption;
  }

  const { data: inserted, error: insertError } = await trainingTable
    .insert({
      title: programme.title,
      slug: programme.slug,
      description: `${programme.title} training programme`,
      schedule: programme.schedule,
      venue: programme.venue,
      capacity: null,
      fees: programme.fees,
      status: "published",
      creator_id: creatorId,
    })
    .select("id,title,slug,fees,schedule,venue")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message || "Could not create training programme record.");
  }

  const row = inserted as Pick<TrainingProgramRow, "id" | "title" | "slug" | "fees" | "schedule" | "venue">;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    fees: toNumber(row.fees),
    schedule: row.schedule,
    venue: row.venue,
  } satisfies TrainingProgrammeOption;
}

async function resolveApplicationProgramme(
  application: TrainingApplicationRow | null,
  selectedProgrammeSlug: string | null
): Promise<TrainingProgrammeOption | null> {
  if (selectedProgrammeSlug) {
    return getProgrammeBySlug(selectedProgrammeSlug);
  }

  if (!application) return null;

  const programmes = await getTrainingProgrammeOptions();
  const fromFallback = programmes.find((item) => item.id === application.training_id);
  if (fromFallback) return fromFallback;

  const supabase = await createClient();
  const trainingTable = supabase.from("training_programs") as any;
  const { data, error } = await trainingTable
    .select("id,title,slug,fees,schedule,venue")
    .eq("id", application.training_id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as Pick<TrainingProgramRow, "id" | "title" | "slug" | "fees" | "schedule" | "venue">;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    fees: toNumber(row.fees),
    schedule: row.schedule,
    venue: row.venue,
  };
}

export async function setTrainingProgramme(programmeSlug: string) {
  const cleaned = programmeSlug.trim();
  if (!cleaned) {
    return {
      success: false as const,
      issues: [{ field: "programme", message: "Select a training programme to continue." }],
    };
  }

  const programme = await getProgrammeBySlug(cleaned);
  const { supabase, user } = await getCurrentUserContext();
  const persistentProgramme = await ensurePersistentProgrammeRecord(programme, user.id);
  const appsTable = supabase.from("training_applications") as any;

  const { data: existing, error: lookupError } = await appsTable
    .select("*")
    .eq("user_id", user.id)
    .eq("training_id", persistentProgramme.id)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  let applicationId = (existing as TrainingApplicationRow | null)?.id || null;

  if (!existing) {
    const { data: inserted, error: insertError } = await appsTable.insert({
      user_id: user.id,
      training_id: persistentProgramme.id,
      status: "pending",
    }).select("id").single();
    if (insertError) throw new Error(insertError.message);
    applicationId = (inserted as Pick<TrainingApplicationRow, "id"> | null)?.id || null;
  }

  return { success: true as const, programme: persistentProgramme, applicationId };
}

export async function saveTrainingParticipantProfile(input: {
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = input.phone.trim();
  const issues: Array<{ field: string; message: string }> = [];

  if (firstName.length < 2) {
    issues.push({ field: "firstName", message: "First name must be at least 2 characters." });
  }
  if (lastName.length < 2) {
    issues.push({ field: "lastName", message: "Last name must be at least 2 characters." });
  }
  if (!PHONE_PATTERN.test(phone)) {
    issues.push({ field: "phone", message: "Enter a valid phone number." });
  }

  if (issues.length > 0) return { success: false as const, issues };

  const { supabase, user } = await getCurrentUserContext();
  const profilesTable = supabase.from("profiles") as any;
  const { error } = await profilesTable
    .update({ first_name: firstName, last_name: lastName, phone })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return { success: true as const };
}

export async function confirmTrainingDocuments(applicationId?: string | null) {
  const { supabase, user } = await getCurrentUserContext();
  const application = applicationId
    ? await getTrainingApplicationByIdForUser(user.id, applicationId, { supabase, user })
    : await getLatestTrainingApplication(user.id, { supabase, user });
  if (!application) {
    return {
      success: false as const,
      issues: [{ field: "documents", message: "Select a programme before continuing." }],
    };
  }

  const profileResp = await (supabase.from("profiles") as any)
    .select("first_name,last_name,phone")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileResp.error) throw new Error(profileResp.error.message);

  const profile =
    (profileResp.data as Pick<ProfileRow, "first_name" | "last_name" | "phone"> | null) || null;
  if (!checkProfileCompleteness(profile)) {
    return {
      success: false as const,
      issues: [{ field: "documents", message: "Complete your profile before continuing." }],
    };
  }

  const appsTable = supabase.from("training_applications") as any;
  const { error } = await appsTable.update({ status: "review" }).eq("id", application.id);
  if (error) throw new Error(error.message);
  return { success: true as const };
}

async function getLatestTrainingPayment(applicationId: string, context?: UserContext) {
  const supabase = context?.supabase || (await getCurrentUserContext()).supabase;
  const paymentsTable = supabase.from("payments") as any;
  const { data, error } = await paymentsTable
    .select("*")
    .eq("entity_type", "training_application")
    .eq("entity_id", applicationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as PaymentRow | null) || null;
}

export async function getTrainingRegistrationSnapshot(options: { programmeSlug?: string | null; applicationId?: string | null } = {}) {
  const { supabase, user } = await getCurrentUserContext();

  const profileResp = await (supabase.from("profiles") as any)
    .select("first_name,last_name,phone")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileResp.error) throw new Error(profileResp.error.message);

  const profile =
    (profileResp.data as Pick<ProfileRow, "first_name" | "last_name" | "phone"> | null) || null;
  const application = options.applicationId
    ? await getTrainingApplicationByIdForUser(user.id, options.applicationId, { supabase, user })
    : await getLatestTrainingApplication(user.id, { supabase, user });
  const programme = await resolveApplicationProgramme(application, options.programmeSlug || null);
  const payment = application ? await getLatestTrainingPayment(application.id, { supabase, user }) : null;

  const personalDetailsComplete = checkProfileCompleteness(profile);
  const documentsComplete = documentsCompleteFromApplication(application);
  const paymentStatus = derivePaymentStatus(payment);
  const progress = getTrainingProgress({
    applicationExists: Boolean(application),
    programmeSelected: Boolean(programme),
    profileComplete: personalDetailsComplete,
    documentsComplete,
    paymentStatus,
  });

  const name = fullName(profile, user.email || null);

  return {
    name,
    initials: initials(name),
    applicationId: application?.id || null,
    programmeLabel: programme?.title || "",
    programmeSlug: programme?.slug || "",
    programmeSelected: Boolean(programme),
    programmeFee: programme?.fees ?? null,
    venue: programme?.venue || null,
    schedule: programme?.schedule || null,
    personalDetailsComplete,
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    phone: profile?.phone || "",
    documentsComplete,
    paymentStatus,
    paymentId: payment?.id || null,
    paymentAmount: payment ? toNumber(payment.amount) : programme?.fees ?? null,
    receiptUploadedAt: payment?.receipt_uploaded_at || null,
    adminNotes: payment?.admin_notes || null,
    currentStep: progress.currentStep,
    maxAllowedStep: progress.maxAllowedStep,
  } satisfies TrainingRegistrationSnapshot;
}

export async function getTrainingRegistrationPayload(options: { programmeSlug?: string | null; applicationId?: string | null } = {}): Promise<TrainingRegistrationPayload> {
  const [snapshot, programmes, bankBase] = await Promise.all([
    getTrainingRegistrationSnapshot(options),
    getTrainingProgrammeOptions(),
    getBankTransferConfig(),
  ]);

  const checklistItems: TrainingChecklistItem[] = TRAINING_REQUIRED_DOCUMENTS.map((item) => ({
    id: item.id,
    label: item.label,
    completed: snapshot.documentsComplete,
  }));

  return {
    snapshot,
    programmes,
    checklist: {
      items: checklistItems,
      uploadedCount: snapshot.documentsComplete ? checklistItems.length : 0,
      requiredCount: checklistItems.length,
      complete: snapshot.documentsComplete,
    },
    bankDetails: {
      ...bankBase,
      amount: snapshot.programmeFee || 0,
    },
  };
}

export async function getTrainingDashboardSnapshot(applicationId?: string | null): Promise<TrainingDashboardSnapshot> {
  const snapshot = await getTrainingRegistrationSnapshot({ applicationId });
  return {
    participantName: snapshot.name,
    participantInitials: snapshot.initials,
    state: resolveDashboardState(snapshot),
    profileComplete: snapshot.personalDetailsComplete,
    checklist: TRAINING_REQUIRED_DOCUMENTS.map((item) => ({
      id: item.id,
      label: item.label,
      completed: snapshot.documentsComplete,
    })),
    applicationId: snapshot.applicationId,
    programmeTitle: snapshot.programmeLabel || null,
    programmeSlug: snapshot.programmeSlug || null,
    programmeFee: snapshot.programmeFee,
    venue: snapshot.venue,
    schedule: snapshot.schedule,
    applicationStatus: snapshot.documentsComplete ? "review" : snapshot.applicationId ? "pending" : null,
    paymentStatus: snapshot.paymentStatus,
    paymentId: snapshot.paymentId,
    receiptUploadedAt: snapshot.receiptUploadedAt,
    adminNotes: snapshot.adminNotes,
  };
}
