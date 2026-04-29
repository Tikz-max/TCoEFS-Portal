import { createClient } from "@/lib/supabase/server";
import { adminClient as rawAdminClient } from "@/lib/supabase/admin";
import { sendEmailWithResend } from "@/lib/email/resend";
import { buildElearningEnrolledEmail } from "@/lib/email/elearning-templates";
import { issueCertificateIfEligible } from "@/features/certificates";
import { createManualPayment } from "@/features/payments";
import type { Database } from "@/types/database.types";
import { getCoursePricing } from "./access";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type CourseRow = Database["public"]["Tables"]["elearning_courses"]["Row"];
type ModuleRow = Database["public"]["Tables"]["elearning_modules"]["Row"];
type QuizRow = Database["public"]["Tables"]["elearning_quizzes"]["Row"];
type EnrollmentRow =
  Database["public"]["Tables"]["elearning_enrollments"]["Row"];
type ElearningCourseStatus = CourseRow["status"];
const adminClient: any = rawAdminClient;

const CREATOR_ROLES = new Set<UserRole>([
  "instructor",
  "e_learning_coordinator",
  "admin",
  "super_admin",
]);

interface QuizQuestionInput {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizAnswerInput {
  questionId: string;
  answer: string;
}

type ModuleType = {
  id: string;
  course_id: string;
  title: string;
  content_type: ModuleRow["content_type"];
  content_url: string | null;
  order: number;
};

export interface AdminElearningListItem {
  id: string;
  title: string;
  slug: string;
  status: CourseRow["status"];
  creatorName: string;
  moduleCount: number;
  quizCount: number;
  enrollmentCount: number;
  updatedAt: string;
  canDelete: boolean;
}

export interface AdminElearningDetail {
  course: CourseRow & {
    creatorName: string;
    modules: ModuleRow[];
    quizCount: number;
    enrollmentCount: number;
  };
  canDelete: boolean;
}

async function getCurrentUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("UNAUTHENTICATED");

  const { data: profile, error } = await (supabase
    .from("profiles")
    .select("role,first_name,last_name")
    .eq("user_id", user.id)
    .maybeSingle() as any);

  if (error) throw new Error(error.message);
  if (!profile) throw new Error("FORBIDDEN");

  return {
    user,
    role: profile.role,
    fullName: `${profile.first_name} ${profile.last_name}`.trim() || "User",
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function redactQuizQuestions(questions: unknown) {
  if (!Array.isArray(questions)) return [];
  return questions.map((item) => {
    const q = item as {
      id?: string;
      question?: string;
      options?: string[];
    };
    return {
      id: q.id || "",
      question: q.question || "",
      options: Array.isArray(q.options) ? q.options : [],
    };
  });
}

function canCreatorManageCourse(input: {
  role: UserRole;
  course: Pick<CourseRow, "creator_id">;
  userId: string;
}) {
  return (
    input.role === "super_admin" ||
    input.role === "admin" ||
    input.course.creator_id === input.userId
  );
}

export async function createCourse(input: {
  title: string;
  description: string;
  thumbnail?: string | null;
}) {
  const context = await getCurrentUserContext();
  if (!CREATOR_ROLES.has(context.role)) throw new Error("FORBIDDEN");

  const baseSlug = slugify(input.title) || `course-${Date.now()}`;
  let slug = baseSlug;
  let nonce = 1;

  while (true) {
    const { data, error } = await adminClient
      .from("elearning_courses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) break;
    nonce += 1;
    slug = `${baseSlug}-${nonce}`;
  }

  const { data: inserted, error } = await adminClient
    .from("elearning_courses")
    .insert({
      title: input.title,
      description: input.description,
      thumbnail: input.thumbnail || null,
      status: "draft",
      creator_id: context.user.id,
      slug,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Could not create course.");
  }

  return { courseId: inserted.id };
}

export async function listCourses(input: {
  scope?: "published" | "enrolled" | "admin" | "all";
}) {
  const scope = input.scope || "published";
  const context = await getCurrentUserContext().catch(() => null);

  if ((scope === "admin" || scope === "all") && !context) {
    throw new Error("UNAUTHENTICATED");
  }

  if (scope === "admin") {
    if (!context || !CREATOR_ROLES.has(context.role)) throw new Error("FORBIDDEN");

    const { data, error } = await adminClient
      .from("elearning_courses")
      .select("*")
      .eq("creator_id", context.user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  if (scope === "all") {
    if (!context || (context.role !== "super_admin" && context.role !== "admin")) throw new Error("FORBIDDEN");
    const { data, error } = await adminClient
      .from("elearning_courses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  if (scope === "enrolled") {
    if (!context) throw new Error("UNAUTHENTICATED");
    const { data: enrollments, error: enrollmentError } = await adminClient
      .from("elearning_enrollments")
      .select("course_id")
      .eq("user_id", context.user.id);
    if (enrollmentError) throw new Error(enrollmentError.message);

    const courseIds = Array.from(
      new Set((enrollments || []).map((row: any) => row.course_id as string))
    );
    if (courseIds.length === 0) return [];

    const { data: courses, error } = await adminClient
      .from("elearning_courses")
      .select("*")
      .in("id", courseIds)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return courses || [];
  }

  const { data, error } = await adminClient
    .from("elearning_courses")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getCourseById(courseId: string) {
  const cleanId = courseId.trim();
  const context = await getCurrentUserContext().catch(() => null);

  const { data: course, error: courseError } = await adminClient
    .from("elearning_courses")
    .select("*")
    .eq("id", cleanId)
    .maybeSingle();

  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");

  const isCreator = context ? course.creator_id === context.user.id : false;
  const isPrivilegedAdmin = context?.role === "super_admin" || context?.role === "admin";
  const canViewDraft = isCreator || isPrivilegedAdmin;

  if (course.status !== "published" && !canViewDraft) {
    throw new Error("FORBIDDEN");
  }

  const { data: modules, error: moduleError } = await adminClient
    .from("elearning_modules")
    .select("*")
    .eq("course_id", cleanId)
    .order("order", { ascending: true });

  if (moduleError) throw new Error(moduleError.message);

  const moduleRows = (modules || []) as ModuleRow[];
  const moduleIds = moduleRows.map((row) => row.id);

  const { data: quizRows, error: quizzesForModulesError } = moduleIds.length
    ? await adminClient
        .from("elearning_quizzes")
        .select("id,module_id,title,passing_score,questions")
        .in("module_id", moduleIds)
    : { data: [], error: null as { message?: string } | null };

  if (quizzesForModulesError) throw new Error(quizzesForModulesError.message || "");

  return {
    ...course,
    modules: moduleRows,
    quizzes: (quizRows || []).map((quiz: any) => ({
      id: quiz.id,
      module_id: quiz.module_id,
      title: quiz.title,
      passing_score: quiz.passing_score,
      questions: redactQuizQuestions(quiz.questions),
    })),
    quizCount: (quizRows || []).length,
  };
}

export async function updateCourse(
  courseId: string,
  updates: Partial<Pick<CourseRow, "title" | "description" | "thumbnail" | "status">>
) {
  const context = await getCurrentUserContext();
  const cleanId = courseId.trim();

  const { data: course, error: courseError } = await adminClient
    .from("elearning_courses")
    .select("*")
    .eq("id", cleanId)
    .maybeSingle();

  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");

  if (!canCreatorManageCourse({ role: context.role, course, userId: context.user.id })) {
    throw new Error("FORBIDDEN");
  }

  const payload: Partial<CourseRow> = {};
  if (typeof updates.title === "string") {
    payload.title = updates.title;
    payload.slug = slugify(updates.title) || course.slug;
  }
  if (typeof updates.description === "string") payload.description = updates.description;
  if (typeof updates.thumbnail !== "undefined") payload.thumbnail = updates.thumbnail;
  if (
    typeof updates.status === "string" &&
    ["draft", "pending_publish", "published", "archived"].includes(updates.status)
  ) {
    payload.status = updates.status as ElearningCourseStatus;
  }

  const { data: updated, error } = await adminClient
    .from("elearning_courses")
    .update(payload)
    .eq("id", cleanId)
    .select("*")
    .single();

  if (error || !updated) throw new Error(error?.message || "Unable to update course.");
  return updated as CourseRow;
}

export async function deleteCourse(courseId: string) {
  const context = await getCurrentUserContext();
  if (context.role !== "super_admin" && context.role !== "admin") throw new Error("FORBIDDEN");

  const { error } = await adminClient.from("elearning_courses").delete().eq("id", courseId);
  if (error) throw new Error(error.message);

  return { success: true };
}

export async function createModule(input: {
  courseId: string;
  title: string;
  contentType: ModuleRow["content_type"];
  contentUrl?: string | null;
  order: number;
}) {
  const context = await getCurrentUserContext();
  const { data: course, error: courseError } = await adminClient
    .from("elearning_courses")
    .select("id,creator_id")
    .eq("id", input.courseId)
    .maybeSingle();
  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");

  if (!canCreatorManageCourse({ role: context.role, course, userId: context.user.id })) {
    throw new Error("FORBIDDEN");
  }

  const { data, error } = await adminClient
    .from("elearning_modules")
    .insert({
      course_id: input.courseId,
      title: input.title,
      content_type: input.contentType,
      content_url: input.contentUrl || null,
      order: input.order,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Could not create module.");
  return data as ModuleRow;
}

export async function updateModule(input: {
  courseId: string;
  moduleId: string;
  title?: string;
  contentType?: ModuleRow["content_type"];
  contentUrl?: string | null;
  order?: number;
}) {
  const context = await getCurrentUserContext();
  const { data: course, error: courseError } = await adminClient
    .from("elearning_courses")
    .select("id,creator_id")
    .eq("id", input.courseId)
    .maybeSingle();
  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");

  if (!canCreatorManageCourse({ role: context.role, course, userId: context.user.id })) {
    throw new Error("FORBIDDEN");
  }

  const payload: Partial<ModuleRow> = {};
  if (typeof input.title === "string") payload.title = input.title;
  if (typeof input.contentType === "string") payload.content_type = input.contentType;
  if (typeof input.contentUrl !== "undefined") payload.content_url = input.contentUrl;
  if (typeof input.order === "number") payload.order = input.order;

  const { data, error } = await adminClient
    .from("elearning_modules")
    .update(payload)
    .eq("id", input.moduleId)
    .eq("course_id", input.courseId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Could not update module.");
  return data as ModuleRow;
}

export async function deleteModule(input: { courseId: string; moduleId: string }) {
  const context = await getCurrentUserContext();
  const { data: course, error: courseError } = await adminClient
    .from("elearning_courses")
    .select("id,creator_id")
    .eq("id", input.courseId)
    .maybeSingle();
  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");

  if (!canCreatorManageCourse({ role: context.role, course, userId: context.user.id })) {
    throw new Error("FORBIDDEN");
  }

  const { error } = await adminClient
    .from("elearning_modules")
    .delete()
    .eq("id", input.moduleId)
    .eq("course_id", input.courseId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function createQuiz(input: {
  courseId: string;
  moduleId: string;
  title: string;
  questions: QuizQuestionInput[];
  passingScore: number;
}) {
  const context = await getCurrentUserContext();
  const { data: course, error: courseError } = await adminClient
    .from("elearning_courses")
    .select("id,creator_id")
    .eq("id", input.courseId)
    .maybeSingle();
  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");

  if (!canCreatorManageCourse({ role: context.role, course, userId: context.user.id })) {
    throw new Error("FORBIDDEN");
  }

  const { data: moduleRow, error: moduleError } = await adminClient
    .from("elearning_modules")
    .select("id")
    .eq("id", input.moduleId)
    .eq("course_id", input.courseId)
    .maybeSingle();

  if (moduleError) throw new Error(moduleError.message);
  if (!moduleRow) throw new Error("Module not found in this course.");

  const { data, error } = await adminClient
    .from("elearning_quizzes")
    .insert({
      module_id: input.moduleId,
      title: input.title,
      questions: input.questions,
      passing_score: input.passingScore,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message || "Could not create quiz.");

  return {
    ...(data as QuizRow),
    questions: redactQuizQuestions(data.questions),
  };
}

export async function getCourseQuizzes(courseId: string) {
  const course = await getCourseById(courseId);
  const moduleIds = (course.modules as ModuleRow[]).map((row) => row.id);

  if (moduleIds.length === 0) return [];

  const { data, error } = await adminClient
    .from("elearning_quizzes")
    .select("*")
    .in("module_id", moduleIds);
  if (error) throw new Error(error.message);

  return (data || []).map((quiz: any) => ({
    ...quiz,
    questions: redactQuizQuestions(quiz.questions),
  }));
}

export async function getQuizByIdForCourse(input: {
  courseId: string;
  quizId: string;
}) {
  const course = await getCourseById(input.courseId);
  const moduleIds = (course.modules as ModuleType[]).map((row: ModuleType) => row.id);
  if (moduleIds.length === 0) throw new Error("Quiz not found.");

  const { data, error } = await adminClient
    .from("elearning_quizzes")
    .select("*")
    .eq("id", input.quizId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Quiz not found.");

  if (!moduleIds.includes(data.module_id)) {
    throw new Error("Quiz not found.");
  }

  return {
    ...data,
    questions: redactQuizQuestions(data.questions),
  };
}

export async function getCourseModule(input: { courseId: string; moduleId: string }) {
  const context = await getCurrentUserContext().catch(() => null);
  const course = await getCourseById(input.courseId);

  const modules = (course.modules as ModuleType[]) || [];
  const module = modules.find((row) => row.id === input.moduleId);
  if (!module) throw new Error("Module not found.");

  let progress: { completed: boolean } | null = null;
  if (context?.role === "participant") {
    const enrollment = await getActiveEnrollmentOrThrow({
      userId: context.user.id,
      courseId: input.courseId,
      slug: course.slug,
    });

    const { data, error } = await adminClient
      .from("elearning_progress")
      .select("completed")
      .eq("enrollment_id", enrollment.id)
      .eq("module_id", input.moduleId)
    .maybeSingle();
    if (error) throw new Error(error.message);
    progress = data || null;
  }

  return {
    course: {
      id: course.id,
      title: course.title,
      status: course.status,
    },
    module,
    progress,
  };
}

export async function getCourseQuizForParticipant(courseId: string) {
  const context = await getCurrentUserContext();
  if (context.role !== "participant") throw new Error("FORBIDDEN");

  const course = await getCourseById(courseId);
  await getActiveEnrollmentOrThrow({
    userId: context.user.id,
    courseId,
    slug: course.slug,
  });
  const quizzes = await getCourseQuizzes(courseId);
  return quizzes;
}

export async function updateQuiz(input: {
  courseId: string;
  quizId: string;
  title?: string;
  questions?: QuizQuestionInput[];
  passingScore?: number;
}) {
  const context = await getCurrentUserContext();

  const { data: course, error: courseError } = await adminClient
    .from("elearning_courses")
    .select("id,creator_id")
    .eq("id", input.courseId)
    .maybeSingle();
  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");

  if (!canCreatorManageCourse({ role: context.role, course, userId: context.user.id })) {
    throw new Error("FORBIDDEN");
  }

  const { data: quizCheck, error: quizCheckError } = await adminClient
    .from("elearning_quizzes")
    .select("id,module_id")
    .eq("id", input.quizId)
    .maybeSingle();

  if (quizCheckError) throw new Error(quizCheckError.message);
  if (!quizCheck) throw new Error("Quiz not found.");

  const { data: moduleCheck, error: moduleCheckError } = await adminClient
    .from("elearning_modules")
    .select("course_id")
    .eq("id", quizCheck.module_id)
    .maybeSingle();

  if (moduleCheckError) throw new Error(moduleCheckError.message);
  if (!moduleCheck || moduleCheck.course_id !== input.courseId) {
    throw new Error("Quiz does not belong to this course.");
  }

  const payload: Partial<QuizRow> = {};
  if (typeof input.title === "string") payload.title = input.title;
  if (Array.isArray(input.questions)) payload.questions = input.questions;
  if (typeof input.passingScore === "number") payload.passing_score = input.passingScore;

  const { data, error } = await adminClient
    .from("elearning_quizzes")
    .update(payload)
    .eq("id", input.quizId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message || "Could not update quiz.");

  return {
    ...(data as QuizRow),
    questions: redactQuizQuestions(data.questions),
  };
}

export async function deleteQuiz(input: { courseId: string; quizId: string }) {
  const context = await getCurrentUserContext();
  const { data: course, error: courseError } = await adminClient
    .from("elearning_courses")
    .select("id,creator_id")
    .eq("id", input.courseId)
    .maybeSingle();
  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");

  if (!canCreatorManageCourse({ role: context.role, course, userId: context.user.id })) {
    throw new Error("FORBIDDEN");
  }

  const { error } = await adminClient.from("elearning_quizzes").delete().eq("id", input.quizId);
  if (error) throw new Error(error.message);
  return { success: true };
}

async function getEnrollmentOrThrow(input: { userId: string; courseId: string }) {
  const { data: enrollment, error } = await adminClient
    .from("elearning_enrollments")
    .select("*")
    .eq("user_id", input.userId)
    .eq("course_id", input.courseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!enrollment) throw new Error("FORBIDDEN");
  return enrollment as EnrollmentRow;
}

async function getActiveEnrollmentOrThrow(input: {
  userId: string;
  courseId: string;
  slug: string;
}) {
  const enrollment = await getEnrollmentOrThrow({
    userId: input.userId,
    courseId: input.courseId,
  });

  const pricing = getCoursePricing(input.slug);
  if (pricing.pricingType === "free") {
    return enrollment;
  }

  const { data: payment, error } = await adminClient
    .from("payments")
    .select("status")
    .eq("user_id", input.userId)
    .eq("entity_type", "elearning_enrollment")
    .eq("entity_id", enrollment.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!payment || payment.status !== "successful") {
    throw new Error("ACCESS_NOT_READY");
  }

  return enrollment;
}

export async function enrollInCourse(courseId: string) {
  const context = await getCurrentUserContext();
  if (context.role !== "participant") throw new Error("FORBIDDEN");

  const { data: course, error: courseError } = await adminClient
    .from("elearning_courses")
    .select("id,title,status,slug")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");
  if (course.status !== "published") {
    throw new Error("Only published courses can be enrolled.");
  }

  const pricing = getCoursePricing(course.slug);

  const { data: existing, error: existingError } = await adminClient
    .from("elearning_enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", context.user.id)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) {
    const existingEnrollment = existing as Pick<EnrollmentRow, "id">;
    const paymentLookup =
      pricing.pricingType === "paid"
        ? await adminClient
            .from("payments")
            .select("id,status,receipt_uploaded_at,receipt_storage_path")
            .eq("user_id", context.user.id)
            .eq("entity_type", "elearning_enrollment")
            .eq("entity_id", existingEnrollment.id)
            .maybeSingle()
        : { data: null, error: null as { message?: string } | null };

    if (paymentLookup.error) throw new Error(paymentLookup.error.message || "");

    const payment = paymentLookup.data as {
      id: string;
      status: "pending" | "successful" | "failed";
      receipt_uploaded_at: string | null;
      receipt_storage_path: string | null;
    } | null;

    const paymentStatus =
      pricing.pricingType === "free"
        ? "successful"
        : !payment
          ? "none"
          : payment.status === "successful"
            ? "successful"
            : payment.status === "failed"
              ? "failed"
              : payment.receipt_uploaded_at || payment.receipt_storage_path
                ? "pending_approval"
                : "pending_receipt";

    return {
      enrollmentId: existingEnrollment.id,
      paymentId: payment?.id || null,
      pricingType: pricing.pricingType,
      amount: pricing.amount,
      accessGranted: pricing.pricingType === "free" || paymentStatus === "successful",
      paymentStatus,
      reused: true,
    };
  }

  const { data: enrollment, error: enrollmentError } = await adminClient
    .from("elearning_enrollments")
    .insert({ course_id: courseId, user_id: context.user.id })
    .select("id")
    .single();

  if (enrollmentError || !enrollment) {
    throw new Error(enrollmentError?.message || "Could not create enrollment.");
  }

  const paymentResult =
    pricing.pricingType === "paid"
      ? await createManualPayment({
          entityType: "elearning_enrollment",
          entityId: enrollment.id,
          amount: pricing.amount,
        })
      : null;

  const { data: usersData } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  }) as any;

  const email = usersData?.users.find((row: { id: string }) => row.id === context.user.id)?.email || null;
  if (email && pricing.pricingType === "free") {
    await sendEmailWithResend({
      to: email,
      ...buildElearningEnrolledEmail({
        recipientName: context.fullName,
        recipientEmail: email,
        courseTitle: course.title,
      }),
    });
  }

  return {
    enrollmentId: enrollment.id,
    paymentId: paymentResult?.paymentId || null,
    pricingType: pricing.pricingType,
    amount: pricing.amount,
    accessGranted: pricing.pricingType === "free",
    paymentStatus: pricing.pricingType === "free" ? "successful" : "pending_receipt",
    reused: false,
  };
}

export async function updateProgress(input: {
  courseId: string;
  moduleId: string;
  completed: boolean;
}) {
  const context = await getCurrentUserContext();
  if (context.role !== "participant") throw new Error("FORBIDDEN");

  const course = await getCourseById(input.courseId);

  const enrollment = await getActiveEnrollmentOrThrow({
    userId: context.user.id,
    courseId: input.courseId,
    slug: course.slug,
  });

  const { data: moduleRow, error: moduleError } = await adminClient
    .from("elearning_modules")
    .select("id,course_id")
    .eq("id", input.moduleId)
    .maybeSingle();
  if (moduleError) throw new Error(moduleError.message);
  if (!moduleRow || moduleRow.course_id !== input.courseId) {
    throw new Error("Module does not belong to this course.");
  }

  const { error: updateError } = await adminClient
    .from("elearning_progress")
    .update({ completed: input.completed })
    .eq("enrollment_id", enrollment.id)
    .eq("module_id", input.moduleId);

  if (updateError) throw new Error(updateError.message);

  const { data: allRows, error: allRowsError } = await adminClient
    .from("elearning_progress")
    .select("completed")
    .eq("enrollment_id", enrollment.id);
  if (allRowsError) throw new Error(allRowsError.message);

  const total = (allRows || []).length;
  const completedCount = (allRows || []).filter((row: any) => Boolean(row.completed)).length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  await issueCertificateIfEligible({
    userId: context.user.id,
    courseId: input.courseId,
  });

  return {
    progress: percentage,
    completedModules: completedCount,
    totalModules: total,
  };
}

export async function submitQuiz(input: {
  courseId: string;
  quizId: string;
  answers: QuizAnswerInput[];
}) {
  const context = await getCurrentUserContext();
  if (context.role !== "participant") throw new Error("FORBIDDEN");

  const course = await getCourseById(input.courseId);

  const enrollment = await getActiveEnrollmentOrThrow({
    userId: context.user.id,
    courseId: input.courseId,
    slug: course.slug,
  });

  const { data: quiz, error: quizError } = await adminClient
    .from("elearning_quizzes")
    .select("id,module_id,questions,passing_score")
    .eq("id", input.quizId)
    .maybeSingle();
  if (quizError) throw new Error(quizError.message);
  if (!quiz) throw new Error("Quiz not found.");

  const { data: moduleRow, error: moduleError } = await adminClient
    .from("elearning_modules")
    .select("id,course_id")
    .eq("id", quiz.module_id)
    .maybeSingle();

  if (moduleError) throw new Error(moduleError.message);
  if (!moduleRow || moduleRow.course_id !== input.courseId) {
    throw new Error("Quiz does not belong to this course.");
  }

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  if (questions.length === 0) {
    throw new Error("Quiz has no questions.");
  }

  const answerMap = new Map(input.answers.map((item) => [item.questionId, item.answer]));
  let correctAnswers = 0;

  for (const question of questions) {
    const expected = (question.correctAnswer || "").trim().toLowerCase();
    const provided = (answerMap.get(question.id) || "").trim().toLowerCase();
    if (expected && provided && expected === provided) {
      correctAnswers += 1;
    }
  }

  const total = questions.length;
  const score = Math.round((correctAnswers / total) * 100);
  const passed = score >= quiz.passing_score;

  const { error: insertError } = await adminClient
    .from("elearning_quiz_submissions")
    .insert({
      enrollment_id: enrollment.id,
      quiz_id: input.quizId,
      user_id: context.user.id,
      answers: input.answers,
      score,
      total_questions: total,
      correct_answers: correctAnswers,
      passed,
    });

  if (insertError) throw new Error(insertError.message);

  await issueCertificateIfEligible({
    userId: context.user.id,
    courseId: input.courseId,
  });

  return { score, total, passed };
}

export async function moderateCourse(input: {
  courseId: string;
  action: "approve" | "reject";
  reason?: string;
}) {
  const context = await getCurrentUserContext();
  if (context.role !== "super_admin") throw new Error("FORBIDDEN");

  const { data: course, error: courseError } = await adminClient
    .from("elearning_courses")
    .select("id,status")
    .eq("id", input.courseId)
    .maybeSingle();

  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error("Course not found.");

  if (course.status !== "pending_publish") {
    throw new Error("Only pending_publish courses can be moderated.");
  }

  const nextStatus = input.action === "approve" ? "published" : "draft";

  const { error } = await adminClient
    .from("elearning_courses")
    .update({ status: nextStatus })
    .eq("id", input.courseId);

  if (error) throw new Error(error.message);

  await adminClient.from("audit_log").insert({
    user_id: context.user.id,
    action: input.action === "approve" ? "approve" : "reject",
    table_name: "elearning_courses",
    record_id: input.courseId,
    old_values: { status: "pending_publish" },
    new_values: {
      status: nextStatus,
      reason: input.reason || null,
    },
  } as never);

  return { courseId: input.courseId, status: nextStatus };
}

async function getElearningAdminContext() {
  const context = await getCurrentUserContext();
  if (
    context.role !== "admin" &&
    context.role !== "super_admin" &&
    context.role !== "e_learning_coordinator"
  ) {
    throw new Error("FORBIDDEN");
  }
  return context;
}

export async function getAdminElearningCourses(): Promise<AdminElearningListItem[]> {
  const context = await getElearningAdminContext();

  let query = adminClient.from("elearning_courses").select("*").order("updated_at", { ascending: false });
  if (context.role === "e_learning_coordinator") {
    query = query.eq("creator_id", context.user.id);
  }

  const { data: courses, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (courses || []) as CourseRow[];
  if (rows.length === 0) return [];

  const courseIds = rows.map((row) => row.id);
  const creatorIds = Array.from(new Set(rows.map((row) => row.creator_id)));

  const [profilesResp, modulesResp, enrollmentsResp, quizzesResp] = await Promise.all([
    adminClient.from("profiles").select("user_id,first_name,last_name").in("user_id", creatorIds),
    adminClient.from("elearning_modules").select("id,course_id").in("course_id", courseIds),
    adminClient.from("elearning_enrollments").select("id,course_id").in("course_id", courseIds),
    adminClient.from("elearning_quizzes").select("id,module_id"),
  ]);

  if (profilesResp.error) throw new Error(profilesResp.error.message);
  if (modulesResp.error) throw new Error(modulesResp.error.message);
  if (enrollmentsResp.error) throw new Error(enrollmentsResp.error.message);
  if (quizzesResp.error) throw new Error(quizzesResp.error.message);

  const creatorNames = new Map(
    ((profilesResp.data || []) as Array<{ user_id: string; first_name: string; last_name: string }>).map((row) => [
      row.user_id,
      `${row.first_name} ${row.last_name}`.trim() || "Coordinator",
    ])
  );

  const modules = (modulesResp.data || []) as Array<{ id: string; course_id: string }>;
  const moduleCountByCourse = new Map<string, number>();
  const moduleToCourse = new Map<string, string>();
  for (const module of modules) {
    moduleToCourse.set(module.id, module.course_id);
    moduleCountByCourse.set(module.course_id, (moduleCountByCourse.get(module.course_id) || 0) + 1);
  }

  const enrollmentCountByCourse = new Map<string, number>();
  for (const enrollment of (enrollmentsResp.data || []) as Array<{ course_id: string }>) {
    enrollmentCountByCourse.set(
      enrollment.course_id,
      (enrollmentCountByCourse.get(enrollment.course_id) || 0) + 1
    );
  }

  const quizCountByCourse = new Map<string, number>();
  for (const quiz of (quizzesResp.data || []) as Array<{ module_id: string }>) {
    const courseId = moduleToCourse.get(quiz.module_id);
    if (!courseId) continue;
    quizCountByCourse.set(courseId, (quizCountByCourse.get(courseId) || 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    creatorName: creatorNames.get(row.creator_id) || "Coordinator",
    moduleCount: moduleCountByCourse.get(row.id) || 0,
    quizCount: quizCountByCourse.get(row.id) || 0,
    enrollmentCount: enrollmentCountByCourse.get(row.id) || 0,
    updatedAt: row.updated_at,
    canDelete: context.role === "admin" || context.role === "super_admin",
  }));
}

export async function getAdminElearningCourse(courseId: string): Promise<AdminElearningDetail> {
  const context = await getElearningAdminContext();
  const course = await getCourseById(courseId);

  if (context.role === "e_learning_coordinator" && course.creator_id !== context.user.id) {
    throw new Error("FORBIDDEN");
  }

  const [profileResp, enrollmentResp] = await Promise.all([
    adminClient
      .from("profiles")
      .select("first_name,last_name")
      .eq("user_id", course.creator_id)
      .maybeSingle(),
    adminClient.from("elearning_enrollments").select("id").eq("course_id", course.id),
  ]);

  if (profileResp.error) throw new Error(profileResp.error.message);
  if (enrollmentResp.error) throw new Error(enrollmentResp.error.message);

  const creatorName = profileResp.data
    ? `${profileResp.data.first_name} ${profileResp.data.last_name}`.trim() || "Coordinator"
    : "Coordinator";

  return {
    course: {
      ...(course as CourseRow),
      creatorName,
      modules: (course.modules || []) as ModuleRow[],
      quizCount: course.quizCount || 0,
      enrollmentCount: (enrollmentResp.data || []).length,
    },
    canDelete: context.role === "admin" || context.role === "super_admin",
  };
}

export async function getElearningAdminLayoutUser() {
  const context = await getElearningAdminContext();

  const roleLabelMap: Record<string, string> = {
    admin: "Admin",
    super_admin: "Super Admin",
    e_learning_coordinator: "E-Learning Coordinator",
  };

  return {
    name: context.fullName,
    initials: context.fullName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    role: context.role === "super_admin" ? "super_admin" : context.role,
    roleLabel: roleLabelMap[context.role] || "Admin",
  };
}
