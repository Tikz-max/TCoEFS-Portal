import type { LayoutUser } from "@/components/layout/types";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generatePresignedReadUrl } from "@/lib/storage/upload";

const ADMIN_ROLES = new Set([
  "admin",
  "admissions_officer",
  "training_coordinator",
  "e_learning_coordinator",
  "super_admin",
]);

export interface AdminWorkspaceCard {
  title: string;
  href: string;
  description: string;
  stat: string;
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function getAdminPortalContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("UNAUTHENTICATED");

  const { data: profile, error } = await (supabase
    .from("profiles")
    .select("first_name,last_name,role")
    .eq("user_id", user.id)
    .maybeSingle() as any);

  if (error) throw new Error(error.message);
  if (!profile || !ADMIN_ROLES.has(profile.role)) throw new Error("FORBIDDEN");

  return {
    user,
    profile: profile as {
      first_name: string;
      last_name: string;
      role:
        | "admin"
        | "admissions_officer"
        | "training_coordinator"
        | "e_learning_coordinator"
        | "super_admin";
    },
  };
}

export async function getAdminPortalLayoutUser(): Promise<LayoutUser> {
  const { user, profile } = await getAdminPortalContext();
  const name = `${profile.first_name} ${profile.last_name}`.trim() || user.email || "Portal Admin";

  const roleLabelMap: Record<string, string> = {
    admin: "Admin",
    admissions_officer: "Admissions Officer",
    training_coordinator: "Training Coordinator",
    e_learning_coordinator: "E-Learning Coordinator",
    super_admin: "Super Admin",
  };

  return {
    name,
    initials: initialsFromName(name),
    role: profile.role as LayoutUser["role"],
    roleLabel: roleLabelMap[profile.role] || "Admin",
  };
}

export async function getAdminWorkspaceCards(): Promise<AdminWorkspaceCard[]> {
  const { profile } = await getAdminPortalContext();

  const [
    pendingCoordinators,
    postgraduateProgrammes,
    trainingPrograms,
    elearningCourses,
    pendingPgApplications,
    pendingTrainingRegs,
    pendingPayments,
    paidPgApplications,
    paidTrainingRegs,
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["training_coordinator", "e_learning_coordinator"])
      .eq("verification_status", "pending"),
    adminClient.from("postgraduate_programmes").select("id", { count: "exact", head: true }),
    adminClient.from("training_programs").select("id", { count: "exact", head: true }),
    adminClient.from("elearning_courses").select("id", { count: "exact", head: true }),
    adminClient
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "review"]),
    adminClient
      .from("training_applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "review"]),
    adminClient
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    adminClient
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    adminClient
      .from("training_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
  ]);

  const cards: AdminWorkspaceCard[] = [];

  if (profile.role === "admin" || profile.role === "super_admin") {
    cards.push({
      title: "Pending applications",
      href: "/admin/applications",
      description: "Postgraduate applications awaiting review",
      stat: `${pendingPgApplications.count || 0} pending`,
    });

    cards.push({
      title: "Approved applications",
      href: "/admin/applications",
      description: "Admitted postgraduate students",
      stat: `${paidPgApplications.count || 0} approved`,
    });

    cards.push({
      title: "Coordinator verification",
      href: "/admin/users",
      description: "Approve newly registered coordinators",
      stat: `${pendingCoordinators.count || 0} pending`,
    });
  }

  if (profile.role === "admin" || profile.role === "super_admin" || profile.role === "admissions_officer") {
    cards.push({
      title: "Postgraduate programmes",
      href: "/admin/postgraduate",
      description: "Edit catalogue entries",
      stat: `${postgraduateProgrammes.count || 0} programmes`,
    });
  }

  if (profile.role === "admin" || profile.role === "super_admin" || profile.role === "training_coordinator") {
    cards.push({
      title: "Training registrations",
      href: "/admin/training/registrations",
      description: "Participant registrations awaiting review",
      stat: `${pendingTrainingRegs.count || 0} pending`,
    });

    cards.push({
      title: "Confirmed trainings",
      href: "/admin/training",
      description: "Registered participants",
      stat: `${paidTrainingRegs.count || 0} confirmed`,
    });

    cards.push({
      title: "Training programmes",
      href: "/admin/training",
      description: "Edit catalogue details",
      stat: `${trainingPrograms.count || 0} programmes`,
    });
  }

  if (profile.role === "admin" || profile.role === "super_admin" || profile.role === "e_learning_coordinator") {
    cards.push({
      title: "E-learning courses",
      href: "/admin/elearning",
      description: "Create, edit, and remove courses",
      stat: `${elearningCourses.count || 0} courses`,
    });
  }

  if (profile.role === "admin" || profile.role === "super_admin") {
    cards.push({
      title: "Payments",
      href: "/admin/payments",
      description: "Pending payment verification",
      stat: `${pendingPayments.count || 0} pending`,
    });
  }

  return cards;
}

export interface PendingCoordinator {
  userId: string;
  fullName: string;
  email: string;
  role: "training_coordinator" | "e_learning_coordinator";
  createdAt: string;
}

export async function getPendingCoordinators(): Promise<PendingCoordinator[]> {
  await getAdminPortalContext();

  const { data: pendingProfiles, error: profilesError } = await adminClient
    .from("profiles")
    .select("user_id,first_name,last_name,role,verification_status,created_at")
    .in("role", ["training_coordinator", "e_learning_coordinator"])
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true });

  if (profilesError) throw new Error(profilesError.message);

  const userIds = (pendingProfiles || []).map((p: any) => p.user_id);
  if (userIds.length === 0) return [];

  const { data: authUsers, error: authError } = await adminClient
    .from("users")
    .select("id,email")
    .in("id", userIds);

  if (authError) throw new Error(authError.message);

  const userEmailMap = new Map((authUsers || []).map((u: any) => [u.id, u.email]));

  return (pendingProfiles || []).map((item: any) => ({
    userId: item.user_id,
    fullName: `${item.first_name} ${item.last_name}`.trim(),
    email: userEmailMap.get(item.user_id) || "",
    role: item.role,
    createdAt: item.created_at,
  }));
}

export interface AdminApplicationListItem {
  id: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  programmeTitle: string;
  programmeSlug: string;
  status: "pending" | "review" | "approved" | "rejected";
  personalStatement: string;
  submittedAt: string | null;
  createdAt: string;
}

export interface AdminApplicationDetail {
  id: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  phone: string;
  programmeTitle: string;
  programmeSlug: string;
  status: "pending" | "review" | "approved" | "rejected";
  personalStatement: string;
  submittedAt: string | null;
  createdAt: string;
  documents: Array<{
    id: string;
    documentType: string;
    filePath: string;
  }>;
  payment: {
    id: string;
    status: string;
    amount: number | null;
    receiptPath: string | null;
    receiptUploadedAt: string | null;
  } | null;
}

export async function getAdminApplications(options?: {
  status?: string;
  search?: string;
}): Promise<AdminApplicationListItem[]> {
  await getAdminPortalContext();

  let query = (adminClient
    .from("applications")
    .select("id,user_id,programme_id,status,personal_statement,created_at")
    .order("created_at", { ascending: false }) as any);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (options?.search) {
    query = query.or(`programme_id.ilike.%${options.search}%`);
  }

  const { data: applications, error } = await query;
  if (error) throw new Error(error.message);
  if (!applications || applications.length === 0) return [];

  const userIds = [...new Set(applications.map((a: any) => a.user_id))];
  const programmeSlugs = [...new Set(applications.map((a: any) => a.programme_id))];

  const [profilesResult, authResult, programmesResult] = await Promise.all([
    (adminClient
      .from("profiles")
      .select("user_id,first_name,last_name")
      .in("user_id", userIds) as any),
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    (adminClient
      .from("postgraduate_programmes")
      .select("id,title,slug")
      .in("slug", programmeSlugs) as any),
  ]);

  const profileMap = new Map(
    (profilesResult.data || []).map((p: any) => [
      p.user_id,
      { firstName: p.first_name, lastName: p.last_name },
    ])
  );
  const emailMap = new Map(
    (authResult.data?.users || []).map((u: any) => [u.id, u.email])
  );
  const programmeMap = new Map(
    (programmesResult.data || []).map((p: any) => [p.slug, p.title])
  );

  return applications.map((app: any) => {
    const profile = profileMap.get(app.user_id) as { firstName: string; lastName: string } | undefined;
    return {
      id: app.id,
      userId: app.user_id,
      applicantName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : "Unknown",
      applicantEmail: emailMap.get(app.user_id) || "",
      programmeTitle: programmeMap.get(app.programme_id) || app.programme_id,
      programmeSlug: app.programme_id,
      status: app.status,
      personalStatement: app.personal_statement || "",
      submittedAt: null,
      createdAt: app.created_at,
    };
  });
}

export async function getAdminApplicationDetail(
  applicationId: string
): Promise<AdminApplicationDetail> {
  const { profile: userProfile } = await getAdminPortalContext();

  if (
    userProfile.role !== "admin" &&
    userProfile.role !== "super_admin" &&
    userProfile.role !== "admissions_officer"
  ) {
    throw new Error("FORBIDDEN");
  }

  const { data: app, error } = await (adminClient
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle() as any);

  if (error) throw new Error(error.message);
  if (!app) throw new Error("Application not found.");

  const userId = app.user_id;

  const [profileResult, authResult, programmeResult, docsResult, paymentResult] =
    await Promise.all([
      (adminClient
        .from("profiles")
        .select("user_id,first_name,last_name,phone")
        .eq("user_id", userId)
        .maybeSingle() as any),
      adminClient.auth.admin.getUserById(userId),
      (adminClient
        .from("postgraduate_programmes")
        .select("title,slug")
        .eq("slug", app.programme_id)
        .maybeSingle() as any),
      (adminClient
        .from("application_documents")
        .select("id,document_type,file_path")
        .eq("application_id", applicationId) as any),
      (adminClient
        .from("payments")
        .select("id,status,amount,receipt_storage_path,receipt_uploaded_at")
        .eq("entity_type", "application")
        .eq("entity_id", applicationId)
        .maybeSingle() as any),
    ]);

  const p = profileResult.data;
  const u = authResult.data?.user;
  const prog = programmeResult.data;

  return {
    id: app.id,
    userId: app.user_id,
    applicantName: p ? `${p.first_name} ${p.last_name}`.trim() : "Unknown",
    applicantEmail: u?.email || "",
    phone: p?.phone || "",
    programmeTitle: prog?.title || app.programme_id,
    programmeSlug: app.programme_id,
    status: app.status,
    personalStatement: app.personal_statement || "",
    submittedAt: null,
    createdAt: app.created_at,
    documents: (docsResult.data || []).map((d: any) => ({
      id: d.id,
      documentType: d.document_type,
      filePath: d.file_path,
    })),
    payment: paymentResult.data
      ? {
          id: paymentResult.data.id,
          status: paymentResult.data.status,
          amount: paymentResult.data.amount,
          receiptPath: paymentResult.data.receipt_storage_path,
          receiptUploadedAt: paymentResult.data.receipt_uploaded_at,
        }
      : null,
  };
}

export async function getAdminApplicationDocumentUrl(
  applicationId: string,
  documentId: string
): Promise<string> {
  const { profile: userProfile } = await getAdminPortalContext();

  if (
    userProfile.role !== "admin" &&
    userProfile.role !== "super_admin" &&
    userProfile.role !== "admissions_officer"
  ) {
    throw new Error("FORBIDDEN");
  }

  const { data: app, error: appError } = await (adminClient
    .from("applications")
    .select("id")
    .eq("id", applicationId)
    .maybeSingle() as any);

  if (appError) throw new Error(appError.message);
  if (!app) throw new Error("Application not found.");

  const { data: doc, error: docError } = await (adminClient
    .from("application_documents")
    .select("file_path")
    .eq("id", documentId)
    .eq("application_id", applicationId)
    .maybeSingle() as any);

  if (docError) throw new Error(docError.message);
  if (!doc?.file_path) throw new Error("Document not found.");

  return generatePresignedReadUrl({ key: doc.file_path, expiresIn: 300 });
}

export async function approveApplication(applicationId: string): Promise<void> {
  const { profile: userProfile } = await getAdminPortalContext();

  if (
    userProfile.role !== "admin" &&
    userProfile.role !== "super_admin" &&
    userProfile.role !== "admissions_officer"
  ) {
    throw new Error("FORBIDDEN");
  }

  const { error } = await (adminClient as any)
    .from("applications")
    .update({ status: "approved" })
    .eq("id", applicationId);

  if (error) throw new Error(error.message);
}

export async function rejectApplication(
  applicationId: string,
  reason: string
): Promise<void> {
  const { user, profile: userProfile } = await getAdminPortalContext();

  if (
    userProfile.role !== "admin" &&
    userProfile.role !== "super_admin" &&
    userProfile.role !== "admissions_officer"
  ) {
    throw new Error("FORBIDDEN");
  }

  const updates: any = { status: "rejected" };
  if (reason) {
    updates.admin_notes = reason;
  }

  const { error } = await (adminClient as any)
    .from("applications")
    .update(updates)
    .eq("id", applicationId);

  if (error) throw new Error(error.message);
}

export async function confirmTrainingRegistration(
  registrationId: string
): Promise<void> {
  const { profile: userProfile } = await getAdminPortalContext();

  if (
    userProfile.role !== "admin" &&
    userProfile.role !== "super_admin" &&
    userProfile.role !== "training_coordinator"
  ) {
    throw new Error("FORBIDDEN");
  }

  const { error } = await (adminClient as any)
    .from("training_applications")
    .update({ status: "approved" })
    .eq("id", registrationId);

  if (error) throw new Error(error.message);
}

export async function rejectTrainingRegistration(
  registrationId: string,
  reason: string
): Promise<void> {
  const { profile: userProfile } = await getAdminPortalContext();

  if (
    userProfile.role !== "admin" &&
    userProfile.role !== "super_admin" &&
    userProfile.role !== "training_coordinator"
  ) {
    throw new Error("FORBIDDEN");
  }

  const updates: { status: string; admin_notes?: string } = { status: "rejected" };
  if (reason) {
    updates.admin_notes = reason;
  }

  const { error } = await (adminClient as any)
    .from("training_applications")
    .update(updates)
    .eq("id", registrationId);

  if (error) throw new Error(error.message);
}
