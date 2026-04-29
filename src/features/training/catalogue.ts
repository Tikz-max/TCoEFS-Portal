import type { Payment, TrainingProgram } from "@/types/database.types";

type TrainingProgramRow = TrainingProgram;
type PaymentRow = Payment;

export type PaidTrainingRegistrationRow = {
  trainingId: string;
  applicationId: string;
};

type TrainingLegacyContent = {
  breadcrumbLabel: string;
  categoryLabel: string;
  categoryColor: string;
  categoryBg: string;
  modeLabel: string;
  durationLabel: string;
  feeSubLabel: string;
  registrationDeadline: string;
  outcomes: string[];
  audience: string[];
  contactEmail: string;
  contactPhone: string;
};

export type PublicTrainingListItem = {
  slug: string;
  title: string;
  category: string;
  mode: string;
  duration: string;
  dates: string;
  fee: string;
  seats: string;
  status: string;
};

export type PublicTrainingDetail = {
  slug: string;
  breadcrumbLabel: string;
  categoryLabel: string;
  categoryColor: string;
  categoryBg: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  title: string;
  overview: string;
  keyDetails: Array<{ label: string; value: string }>;
  outcomes: string[];
  audience: string[];
  feeType: "single" | "tiered";
  fee: string;
  feeTiers: Array<{ label: string; amount: string }>;
  feeSubLabel: string;
  registrationDetails: Array<{ label: string; value: string }>;
  contactEmail: string;
  contactPhone: string;
};

const DEFAULT_CONTACT_EMAIL = "training@tcoefs.unijos.edu.ng";
const DEFAULT_CONTACT_PHONE = "+234 (0) 803 XXX XXXX";

const LEGACY_CONTENT: Record<string, TrainingLegacyContent> = {
  "sustainable-crop-production": {
    breadcrumbLabel: "Crop Production",
    categoryLabel: "Crop Science",
    categoryColor: "#166534",
    categoryBg: "rgba(22,101,52,0.3)",
    modeLabel: "On-site",
    durationLabel: "5 Days",
    feeSubLabel: "per participant · incl. field materials & lunch",
    registrationDeadline: "5 March 2025",
    outcomes: [
      "Apply integrated soil fertility management strategies to improve crop yields",
      "Select appropriate varieties and seed systems for North-Central agroecologies",
      "Design a practical integrated pest and disease management plan",
      "Implement post-harvest handling procedures to reduce loss at farm level",
      "Operate and maintain small-scale grain storage structures correctly",
    ],
    audience: ["Smallholder farmers", "Extension officers", "Agronomists", "Seed system practitioners", "NGO field staff"],
    contactEmail: DEFAULT_CONTACT_EMAIL,
    contactPhone: DEFAULT_CONTACT_PHONE,
  },
  "food-safety-standards-haccp": {
    breadcrumbLabel: "Food Safety & HACCP",
    categoryLabel: "Food Processing",
    categoryColor: "#7C3AED",
    categoryBg: "rgba(124,58,237,0.2)",
    modeLabel: "Online",
    durationLabel: "5 Days",
    feeSubLabel: "per participant · incl. course materials",
    registrationDeadline: "2 April 2025",
    outcomes: [
      "Map food safety risks across processing workflows",
      "Build a practical HACCP plan for a food enterprise",
      "Interpret core NAFDAC-aligned compliance requirements",
      "Strengthen batch traceability and quality control procedures",
      "Prepare internal staff for safer plant operations",
    ],
    audience: ["Food processors", "Quality officers", "Extension agents", "SME founders", "Factory supervisors"],
    contactEmail: DEFAULT_CONTACT_EMAIL,
    contactPhone: DEFAULT_CONTACT_PHONE,
  },
  "climate-smart-agriculture": {
    breadcrumbLabel: "Climate-Smart Agriculture",
    categoryLabel: "Climate",
    categoryColor: "#166534",
    categoryBg: "rgba(22,101,52,0.3)",
    modeLabel: "On-site",
    durationLabel: "5 Days",
    feeSubLabel: "per participant · incl. materials & lunch",
    registrationDeadline: "17 April 2025",
    outcomes: [
      "Assess climate risks across local farming systems",
      "Apply resilient water, soil, and cropping practices",
      "Integrate adaptation planning into farm operations",
      "Use climate information for production decisions",
      "Build action plans for sustainable field implementation",
    ],
    audience: ["Farm managers", "Extension workers", "Researchers", "Climate project staff", "Producers"],
    contactEmail: DEFAULT_CONTACT_EMAIL,
    contactPhone: DEFAULT_CONTACT_PHONE,
  },
  "irrigation-management-water-conservation": {
    breadcrumbLabel: "Irrigation Management",
    categoryLabel: "Agribusiness",
    categoryColor: "#1E40AF",
    categoryBg: "rgba(30,64,175,0.3)",
    modeLabel: "On-site",
    durationLabel: "5 Days",
    feeSubLabel: "per participant · incl. materials & lunch",
    registrationDeadline: "1 May 2025",
    outcomes: [
      "Plan efficient irrigation schedules for farm systems",
      "Reduce field-level water loss through better practices",
      "Maintain small and medium irrigation infrastructure",
      "Compare irrigation options for different value chains",
      "Track water productivity against farm output goals",
    ],
    audience: ["Farm operators", "Irrigation technicians", "Extension officers", "Project managers", "Water user groups"],
    contactEmail: DEFAULT_CONTACT_EMAIL,
    contactPhone: DEFAULT_CONTACT_PHONE,
  },
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseScheduleDays(raw: string | null) {
  if (!raw) return [] as Array<{ date?: string }>;
  try {
    const parsed = JSON.parse(raw) as Array<{ date?: string }>;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function deriveDatesLabel(row: TrainingProgramRow, legacy: TrainingLegacyContent | null) {
  const days = parseScheduleDays(row.schedule);
  const dated = days.map((item) => item.date).filter((item): item is string => Boolean(item));
  if (dated.length > 0) {
    return dated.length === 1 ? dated[0] : `${dated[0]} - ${dated[dated.length - 1]}`;
  }
  return row.schedule || legacy?.durationLabel || "Schedule to be announced";
}

function deriveDurationLabel(row: TrainingProgramRow, legacy: TrainingLegacyContent | null) {
  if (row.duration_label) return row.duration_label;
  const days = parseScheduleDays(row.schedule);
  if (days.length > 0) return `${days.length} Day${days.length === 1 ? "" : "s"}`;
  return legacy?.durationLabel || "Short course";
}

function deriveModeLabel(row: TrainingProgramRow, legacy: TrainingLegacyContent | null) {
  if (row.mode_label) return row.mode_label;
  if (legacy?.modeLabel) return legacy.modeLabel;
  const venue = (row.venue || "").toLowerCase();
  if (venue.includes("online") && venue.includes("+")) return "Hybrid";
  if (venue.includes("online")) return "Online";
  return "On-site";
}

function categoryTone(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("food")) {
    return { color: "#7C3AED", bg: "rgba(124,58,237,0.2)" };
  }
  if (normalized.includes("climate") || normalized.includes("crop")) {
    return { color: "#166534", bg: "rgba(22,101,52,0.3)" };
  }
  return { color: "#1E40AF", bg: "rgba(30,64,175,0.3)" };
}

function statusPresentation(status: TrainingProgramRow["status"]) {
  if (status === "registration_closed") {
    return {
      listLabel: "Closing Soon",
      detailLabel: "Registration Closing",
      textColor: "#92400E",
      bgColor: "rgba(146,64,14,0.2)",
    };
  }
  if (status === "in_progress") {
    return {
      listLabel: "In Progress",
      detailLabel: "In Progress",
      textColor: "#1E40AF",
      bgColor: "rgba(30,64,175,0.2)",
    };
  }
  if (status === "completed") {
    return {
      listLabel: "Completed",
      detailLabel: "Completed",
      textColor: "#526052",
      bgColor: "rgba(82,96,82,0.15)",
    };
  }
  return {
    listLabel: "Open",
    detailLabel: "Open for Registration",
    textColor: "#166534",
    bgColor: "rgba(22,101,52,0.35)",
  };
}

function defaultOutcomes(title: string) {
  return [
    `Understand the core practical concepts covered in ${title}`,
    "Apply the training content to real implementation settings",
    "Work through guided examples and field-ready case studies",
    "Leave with usable notes, frameworks, and follow-up actions",
  ];
}

function defaultAudience(category: string) {
  return [
    `${category} practitioners`,
    "Programme officers",
    "Researchers and field staff",
    "Entrepreneurs and operators",
  ];
}

function seatLabel(filled: number, capacity: number | null) {
  if (!capacity || capacity <= 0) return `${filled} paid`;
  return `${filled} / ${capacity} filled`;
}

export function countPaidRegistrationsByTraining(rows: PaidTrainingRegistrationRow[]) {
  const byTraining = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!byTraining.has(row.trainingId)) byTraining.set(row.trainingId, new Set());
    byTraining.get(row.trainingId)?.add(row.applicationId);
  }
  const counts = new Map<string, number>();
  for (const [trainingId, applicationIds] of byTraining.entries()) {
    counts.set(trainingId, applicationIds.size);
  }
  return counts;
}

export function canDeleteTrainingProgramme(registrationCount: number) {
  return registrationCount === 0;
}

async function loadPaidCounts(trainingIds: string[]) {
  const { adminClient } = await import("@/lib/supabase/admin");
  if (trainingIds.length === 0) return new Map<string, number>();
  const appResp = await adminClient
    .from("training_applications")
    .select("id,training_id")
    .in("training_id", trainingIds);
  if (appResp.error) throw new Error(appResp.error.message);

  const applications = (appResp.data || []) as Array<{ id: string; training_id: string }>;
  if (applications.length === 0) return new Map<string, number>();

  const paymentResp = await adminClient
    .from("payments")
    .select("entity_id")
    .eq("entity_type", "training_application")
    .eq("status", "successful")
    .in("entity_id", applications.map((row) => row.id));
  if (paymentResp.error) throw new Error(paymentResp.error.message);

  const trainingByApplication = new Map(applications.map((row) => [row.id, row.training_id]));
  const paidRows: PaidTrainingRegistrationRow[] = ((paymentResp.data || []) as Array<Pick<PaymentRow, "entity_id">>)
    .map((payment) => {
      const trainingId = trainingByApplication.get(payment.entity_id);
      return trainingId
        ? { trainingId, applicationId: payment.entity_id }
        : null;
    })
    .filter((item): item is PaidTrainingRegistrationRow => Boolean(item));

  return countPaidRegistrationsByTraining(paidRows);
}

export async function getPublicTrainingCatalogue() {
  const { adminClient } = await import("@/lib/supabase/admin");
  const trainingResp = await adminClient
    .from("training_programs")
    .select("*")
    .in("status", ["published", "registration_closed", "in_progress", "completed"])
    .order("created_at", { ascending: false });
  if (trainingResp.error) throw new Error(trainingResp.error.message);

  const rows = (trainingResp.data || []) as TrainingProgramRow[];
  const paidCounts = await loadPaidCounts(rows.map((row) => row.id));

  return rows.map((row): PublicTrainingListItem => {
    const legacy = LEGACY_CONTENT[row.slug] || null;
    const status = statusPresentation(row.status);
    return {
      slug: row.slug,
      title: row.title,
      category: row.category_label || legacy?.categoryLabel || "General Training",
      mode: deriveModeLabel(row, legacy),
      duration: deriveDurationLabel(row, legacy),
      dates: deriveDatesLabel(row, legacy),
      fee: formatCurrency(toNumber(row.fees)),
      seats: seatLabel(paidCounts.get(row.id) || 0, row.capacity),
      status: status.listLabel,
    };
  });
}

export async function getPublicTrainingDetailBySlug(slug: string): Promise<PublicTrainingDetail | null> {
  const { adminClient } = await import("@/lib/supabase/admin");
  const trainingResp = await adminClient
    .from("training_programs")
    .select("*")
    .eq("slug", slug)
    .in("status", ["published", "registration_closed", "in_progress", "completed"])
    .maybeSingle();
  if (trainingResp.error) throw new Error(trainingResp.error.message);
  const row = trainingResp.data as TrainingProgramRow | null;
  if (!row) return null;

  const paidCounts = await loadPaidCounts([row.id]);
  const legacy = LEGACY_CONTENT[row.slug] || null;
  const categoryLabel = row.category_label || legacy?.categoryLabel || "General Training";
  const categoryStyle = categoryTone(categoryLabel);
  const status = statusPresentation(row.status);
  const mode = deriveModeLabel(row, legacy);
  const dates = deriveDatesLabel(row, legacy);
  const duration = deriveDurationLabel(row, legacy);
  const seats = seatLabel(paidCounts.get(row.id) || 0, row.capacity);

  const feeType = (row.fee_type as "single" | "tiered") || "single";
  const feeTiersRaw = Array.isArray(row.fee_tiers) ? row.fee_tiers : [];
  const feeTiers = feeTiersRaw.map((tier) => ({
    label: tier.label || "",
    amount: formatCurrency(Number(tier.amount) || 0),
  }));

  return {
    slug: row.slug,
    breadcrumbLabel: row.breadcrumb_label || legacy?.breadcrumbLabel || titleCase(categoryLabel),
    categoryLabel,
    categoryColor: categoryStyle.color,
    categoryBg: categoryStyle.bg,
    statusLabel: status.detailLabel,
    statusColor: status.textColor,
    statusBg: status.bgColor,
    title: row.title,
    overview: row.description || `${row.title} is part of the TCoEFS practical training catalogue. Full delivery details are managed by the training team.`,
    keyDetails: [
      { label: "Duration", value: duration },
      { label: "Mode", value: mode },
      { label: "Venue", value: row.venue || "To be announced" },
    ],
    outcomes: Array.isArray(row.outcomes) && row.outcomes.length > 0 ? row.outcomes : legacy?.outcomes || defaultOutcomes(row.title),
    audience: Array.isArray(row.audience) && row.audience.length > 0 ? row.audience : legacy?.audience || defaultAudience(categoryLabel),
    feeType,
    fee: formatCurrency(toNumber(row.fees)),
    feeTiers,
    feeSubLabel: row.fee_sub_label || legacy?.feeSubLabel || "per participant",
    registrationDetails: [
      { label: "Dates", value: dates },
      { label: "Registration Deadline", value: row.registration_deadline || legacy?.registrationDeadline || "To be announced" },
      { label: "Mode", value: mode },
      { label: "Venue", value: row.venue || "To be announced" },
      { label: "Paid Seats", value: seats },
    ],
    contactEmail: row.contact_email || legacy?.contactEmail || DEFAULT_CONTACT_EMAIL,
    contactPhone: row.contact_phone || legacy?.contactPhone || DEFAULT_CONTACT_PHONE,
  };
}
