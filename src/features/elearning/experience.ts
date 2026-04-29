import { createClient } from "@/lib/supabase/server";
import { adminClient as rawAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";
import {
  getCourseCommerceMetadata,
  resolveLearnerCourseAccess,
  type CoursePaymentStatus,
} from "./access";

type CourseRow = Database["public"]["Tables"]["elearning_courses"]["Row"];
type ModuleRow = Database["public"]["Tables"]["elearning_modules"]["Row"];
type EnrollmentRow =
  Database["public"]["Tables"]["elearning_enrollments"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];
type ProfileRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];

const adminClient: any = rawAdminClient;

interface ViewerContext {
  userId: string;
  role: ProfileRole;
}

async function getOptionalViewerContext(): Promise<ViewerContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await (supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle() as any);

  if (error || !profile) return null;

  return {
    userId: user.id,
    role: profile.role as ProfileRole,
  };
}

function derivePaymentStatus(payment: Pick<
  PaymentRow,
  "status" | "receipt_storage_path" | "receipt_uploaded_at"
>): CoursePaymentStatus {
  if (payment.status === "successful") return "successful";
  if (payment.status === "failed") return "failed";
  if (payment.receipt_uploaded_at || payment.receipt_storage_path) {
    return "pending_approval";
  }
  return "pending_receipt";
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

async function getModuleRowsForCourses(courseIds: string[]) {
  if (courseIds.length === 0) return [] as ModuleRow[];
  const { data, error } = await adminClient
    .from("elearning_modules")
    .select("*")
    .in("course_id", courseIds)
    .order("order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as ModuleRow[];
}

async function getParticipantEnrollmentMaps(userId: string, courseIds: string[]) {
  if (courseIds.length === 0) {
    return {
      enrollmentsByCourseId: new Map<string, EnrollmentRow>(),
      paymentByEnrollmentId: new Map<string, PaymentRow>(),
      certificateByCourseId: new Map<string, CertificateRow>(),
      completedModuleIdsByEnrollmentId: new Map<string, Set<string>>(),
      passedQuizIdsByEnrollmentId: new Map<string, Set<string>>(),
    };
  }

  const { data: enrollmentRows, error: enrollmentError } = await adminClient
    .from("elearning_enrollments")
    .select("*")
    .eq("user_id", userId)
    .in("course_id", courseIds);
  if (enrollmentError) throw new Error(enrollmentError.message);

  const enrollments = (enrollmentRows || []) as EnrollmentRow[];
  const enrollmentsByCourseId = new Map(enrollments.map((row) => [row.course_id, row]));
  const enrollmentIds = enrollments.map((row) => row.id);

  const [{ data: paymentRows, error: paymentError }, { data: certificateRows, error: certificateError }] =
    await Promise.all([
      enrollmentIds.length > 0
        ? adminClient
            .from("payments")
            .select("*")
            .eq("user_id", userId)
            .eq("entity_type", "elearning_enrollment")
            .in("entity_id", enrollmentIds)
        : Promise.resolve({ data: [], error: null }),
      adminClient
        .from("certificates")
        .select("*")
        .eq("user_id", userId)
        .in("course_id", courseIds),
    ]);

  if (paymentError) throw new Error(paymentError.message);
  if (certificateError) throw new Error(certificateError.message);

  const paymentByEnrollmentId = new Map(
    ((paymentRows || []) as PaymentRow[]).map((row) => [row.entity_id, row])
  );
  const certificateByCourseId = new Map(
    ((certificateRows || []) as CertificateRow[]).map((row) => [row.course_id, row])
  );

  const [progressRows, quizSubmissionRows] = await Promise.all([
    enrollmentIds.length > 0
      ? adminClient
          .from("elearning_progress")
          .select("enrollment_id,module_id,completed")
          .in("enrollment_id", enrollmentIds)
          .eq("completed", true)
      : Promise.resolve({ data: [], error: null }),
    enrollmentIds.length > 0
      ? adminClient
          .from("elearning_quiz_submissions")
          .select("enrollment_id,quiz_id,passed")
          .eq("user_id", userId)
          .in("enrollment_id", enrollmentIds)
          .eq("passed", true)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (progressRows.error) throw new Error(progressRows.error.message);
  if (quizSubmissionRows.error) throw new Error(quizSubmissionRows.error.message);

  const completedModuleIdsByEnrollmentId = new Map<string, Set<string>>();
  for (const row of (progressRows.data || []) as Array<{
    enrollment_id: string;
    module_id: string;
  }>) {
    const current = completedModuleIdsByEnrollmentId.get(row.enrollment_id) || new Set<string>();
    current.add(row.module_id);
    completedModuleIdsByEnrollmentId.set(row.enrollment_id, current);
  }

  const passedQuizIdsByEnrollmentId = new Map<string, Set<string>>();
  for (const row of (quizSubmissionRows.data || []) as Array<{
    enrollment_id: string;
    quiz_id: string;
  }>) {
    const current = passedQuizIdsByEnrollmentId.get(row.enrollment_id) || new Set<string>();
    current.add(row.quiz_id);
    passedQuizIdsByEnrollmentId.set(row.enrollment_id, current);
  }

  return {
    enrollmentsByCourseId,
    paymentByEnrollmentId,
    certificateByCourseId,
    completedModuleIdsByEnrollmentId,
    passedQuizIdsByEnrollmentId,
  };
}

async function getQuizIdsByCourse(courseIds: string[], modules: ModuleRow[]) {
  const moduleIds = modules.map((row) => row.id);
  if (moduleIds.length === 0) return new Map<string, string[]>();

  const { data, error } = await adminClient
    .from("elearning_quizzes")
    .select("id,module_id")
    .in("module_id", moduleIds);

  if (error) throw new Error(error.message);

  const moduleById = new Map(modules.map((row) => [row.id, row.course_id]));
  const quizIdsByCourse = new Map<string, string[]>();

  for (const row of (data || []) as Array<{ id: string; module_id: string }>) {
    const courseId = moduleById.get(row.module_id);
    if (!courseId) continue;
    const current = quizIdsByCourse.get(courseId) || [];
    current.push(row.id);
    quizIdsByCourse.set(courseId, current);
  }

  return quizIdsByCourse;
}

function buildCourseCard(input: {
  course: CourseRow;
  modules: ModuleRow[];
  quizIds: string[];
  enrollment?: EnrollmentRow;
  payment?: PaymentRow;
  certificate?: CertificateRow;
  completedModuleIds: Set<string>;
  passedQuizIds: Set<string>;
}) {
  const metadata = getCourseCommerceMetadata(input.course.slug);
  const totalModules = input.modules.length;
  const completedModules = input.completedModuleIds.size;
  const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const paymentStatus = input.payment ? derivePaymentStatus(input.payment) : "none";
  const access = resolveLearnerCourseAccess({
    pricingType: metadata.pricingType,
    hasEnrollment: Boolean(input.enrollment),
    paymentStatus,
    hasCertificate: Boolean(input.certificate),
    progressPercent,
  });

  return {
    id: input.course.id,
    slug: input.course.slug,
    title: input.course.title,
    description: input.course.description,
    thumbnail: input.course.thumbnail,
    category: metadata.category,
    level: metadata.level,
    durationLabel: metadata.durationLabel,
    pricingType: metadata.pricingType,
    amount: metadata.amount,
    amountLabel: metadata.pricingType === "free" ? "Free" : formatCurrency(metadata.amount),
    certificateEnabled: metadata.certificateEnabled,
    accent: metadata.accent,
    totalModules,
    completedModules,
    totalQuizzes: input.quizIds.length,
    passedQuizzes: input.quizIds.filter((id) => input.passedQuizIds.has(id)).length,
    progressPercent,
    enrollmentId: input.enrollment?.id || null,
    paymentId: input.payment?.id || null,
    paymentStatus,
    receiptUploadedAt: input.payment?.receipt_uploaded_at || null,
    paymentAdminNotes: input.payment?.admin_notes || null,
    certificateId: input.certificate?.id || null,
    certificateNumber: input.certificate?.certificate_number || null,
    state: access.state,
    canAccessContent: access.canAccessContent,
    ctaLabel: access.ctaLabel,
    firstModuleId: input.modules[0]?.id || null,
  };
}

async function getPublishedCourses() {
  const { data, error } = await adminClient
    .from("elearning_courses")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as CourseRow[];
}

export async function getCourseCatalogSnapshot() {
  const viewer = await getOptionalViewerContext();
  const courses = await getPublishedCourses();
  const courseIds = courses.map((row) => row.id);
  const modules = await getModuleRowsForCourses(courseIds);
  const modulesByCourseId = new Map<string, ModuleRow[]>();
  for (const row of modules) {
    const current = modulesByCourseId.get(row.course_id) || [];
    current.push(row);
    modulesByCourseId.set(row.course_id, current);
  }
  const quizIdsByCourse = await getQuizIdsByCourse(courseIds, modules);

  const participantMaps =
    viewer?.role === "participant"
      ? await getParticipantEnrollmentMaps(viewer.userId, courseIds)
      : null;

  return courses.map((course) => {
    const enrollment = participantMaps?.enrollmentsByCourseId.get(course.id);
    const payment = enrollment
      ? participantMaps?.paymentByEnrollmentId.get(enrollment.id)
      : undefined;
    const certificate = participantMaps?.certificateByCourseId.get(course.id);
    const completedModuleIds = enrollment
      ? participantMaps?.completedModuleIdsByEnrollmentId.get(enrollment.id) || new Set<string>()
      : new Set<string>();
    const passedQuizIds = enrollment
      ? participantMaps?.passedQuizIdsByEnrollmentId.get(enrollment.id) || new Set<string>()
      : new Set<string>();

    return buildCourseCard({
      course,
      modules: modulesByCourseId.get(course.id) || [],
      quizIds: quizIdsByCourse.get(course.id) || [],
      enrollment,
      payment,
      certificate,
      completedModuleIds,
      passedQuizIds,
    });
  });
}

export async function getPublicCourseDetailBySlug(slug: string) {
  const cleanSlug = slug.trim();
  const catalog = await getCourseCatalogSnapshot();
  const course = catalog.find((row) => row.slug === cleanSlug);
  if (!course) throw new Error("Course not found.");

  const { data: dbCourse, error } = await adminClient
    .from("elearning_courses")
    .select("id")
    .eq("slug", cleanSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!dbCourse) throw new Error("Course not found.");

  const { data: modules, error: moduleError } = await adminClient
    .from("elearning_modules")
    .select("id,title,content_type,order")
    .eq("course_id", dbCourse.id)
    .order("order", { ascending: true });
  if (moduleError) throw new Error(moduleError.message);

  return {
    ...course,
    modules: (modules || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      type: row.content_type,
      order: row.order,
    })),
  };
}

export async function getLearnerDashboardSnapshot() {
  const viewer = await getOptionalViewerContext();
  if (!viewer) throw new Error("UNAUTHENTICATED");
  if (viewer.role !== "participant") throw new Error("FORBIDDEN");

  const courses = await getCourseCatalogSnapshot();

  return {
    stats: {
      active: courses.filter((row) => row.state === "active").length,
      pending: courses.filter(
        (row) => row.state === "payment_pending" || row.state === "payment_required"
      ).length,
      completed: courses.filter((row) => row.state === "completed").length,
      certificates: courses.filter((row) => row.certificateId).length,
    },
    activeCourses: courses.filter((row) => row.state === "active"),
    pendingCourses: courses.filter(
      (row) => row.state === "payment_required" || row.state === "payment_pending" || row.state === "payment_rejected"
    ),
    availableCourses: courses.filter((row) => row.state === "free_available"),
    completedCourses: courses.filter((row) => row.state === "completed"),
    allCourses: courses,
  };
}

function getCurrentOpenModule(modules: ModuleRow[], completedModuleIds: Set<string>) {
  for (const module of modules) {
    if (!completedModuleIds.has(module.id)) return module.id;
  }
  return modules[0]?.id || null;
}

export async function getLearnerCourseWorkspace(courseId: string, moduleId?: string | null) {
  const viewer = await getOptionalViewerContext();
  if (!viewer) throw new Error("UNAUTHENTICATED");
  if (viewer.role !== "participant") throw new Error("FORBIDDEN");

  const { data: course, error: courseError } = await adminClient
    .from("elearning_courses")
    .select("*")
    .eq("id", courseId)
    .eq("status", "published")
    .maybeSingle();
  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");

  const modules = await getModuleRowsForCourses([courseId]);
  const quizIdsByCourse = await getQuizIdsByCourse([courseId], modules);
  const participantMaps = await getParticipantEnrollmentMaps(viewer.userId, [courseId]);
  const enrollment = participantMaps.enrollmentsByCourseId.get(courseId);
  const payment = enrollment ? participantMaps.paymentByEnrollmentId.get(enrollment.id) : undefined;
  const certificate = participantMaps.certificateByCourseId.get(courseId);
  const completedModuleIds = enrollment
    ? participantMaps.completedModuleIdsByEnrollmentId.get(enrollment.id) || new Set<string>()
    : new Set<string>();
  const passedQuizIds = enrollment
    ? participantMaps.passedQuizIdsByEnrollmentId.get(enrollment.id) || new Set<string>()
    : new Set<string>();

  const summary = buildCourseCard({
    course: course as CourseRow,
    modules,
    quizIds: quizIdsByCourse.get(courseId) || [],
    enrollment,
    payment,
    certificate,
    completedModuleIds,
    passedQuizIds,
  });

  if (!summary.canAccessContent) {
    throw new Error("ACCESS_NOT_READY");
  }

  const openModuleId = getCurrentOpenModule(modules, completedModuleIds);
  const selectedModuleId = moduleId && modules.some((row) => row.id === moduleId) ? moduleId : openModuleId;
  const selectedModule = modules.find((row) => row.id === selectedModuleId);
  if (!selectedModule) throw new Error("Module not found.");

  const { data: quizzes, error: quizError } = await adminClient
    .from("elearning_quizzes")
    .select("id,module_id,title,passing_score,questions")
    .in("module_id", modules.map((row) => row.id));
  if (quizError) throw new Error(quizError.message);

  const quizzesByModuleId = new Map<string, any[]>();
  for (const quiz of quizzes || []) {
    const current = quizzesByModuleId.get(quiz.module_id) || [];
    current.push(quiz);
    quizzesByModuleId.set(quiz.module_id, current);
  }

  const currentOpenId = openModuleId;
  const moduleList = modules.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.content_type,
    completed: completedModuleIds.has(row.id),
    current: row.id === selectedModule.id,
    recommended: row.id === currentOpenId,
    quizCount: (quizzesByModuleId.get(row.id) || []).length,
  }));

  return {
    course: summary,
    selectedModule: {
      id: selectedModule.id,
      title: selectedModule.title,
      type: selectedModule.content_type,
      contentUrl: selectedModule.content_url,
      completed: completedModuleIds.has(selectedModule.id),
      quizzes: (quizzesByModuleId.get(selectedModule.id) || []).map((quiz: any) => ({
        id: quiz.id,
        title: quiz.title,
        passingScore: quiz.passing_score,
        questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
        passed: passedQuizIds.has(quiz.id),
      })),
    },
    modules: moduleList,
  };
}
