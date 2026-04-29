import { createClient } from "@/lib/supabase/server";
import { adminClient as rawAdminClient } from "@/lib/supabase/admin";
import { sendEmailWithResend } from "@/lib/email/resend";
import { buildCertificateIssuedEmail } from "@/lib/email/elearning-templates";
import type { Database } from "@/types/database.types";

type UserRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];
type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];
type EnrollmentRow = Database["public"]["Tables"]["elearning_enrollments"]["Row"];
const adminClient: any = rawAdminClient;

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
  };
}

async function getCourseCompletionState(input: {
  userId: string;
  courseId: string;
}): Promise<{
  enrollment: EnrollmentRow | null;
  totalModules: number;
  completedModules: number;
  totalQuizzes: number;
  passedQuizzes: number;
}> {
  const { data: enrollment, error: enrollmentError } = await adminClient
    .from("elearning_enrollments")
    .select("*")
    .eq("course_id", input.courseId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (enrollmentError) throw new Error(enrollmentError.message);
  if (!enrollment) {
    return {
      enrollment: null,
      totalModules: 0,
      completedModules: 0,
      totalQuizzes: 0,
      passedQuizzes: 0,
    };
  }

  const { data: modules, error: modulesError } = await adminClient
    .from("elearning_modules")
    .select("id")
    .eq("course_id", input.courseId);

  if (modulesError) throw new Error(modulesError.message);

  const moduleIds = (modules || []).map((row: any) => row.id as string);

  const { data: completedRows, error: progressError } = await adminClient
    .from("elearning_progress")
    .select("module_id")
    .eq("enrollment_id", enrollment.id)
    .eq("completed", true);

  if (progressError) throw new Error(progressError.message);

  let totalQuizzes = 0;
  let passedQuizzes = 0;

  if (moduleIds.length > 0) {
    const { data: quizzes, error: quizzesError } = await adminClient
      .from("elearning_quizzes")
      .select("id")
      .in("module_id", moduleIds);

    if (quizzesError) throw new Error(quizzesError.message);

    const quizIds = (quizzes || []).map((row: any) => row.id as string);
    totalQuizzes = quizIds.length;

    if (quizIds.length > 0) {
      const { data: submissions, error: submissionsError } = await adminClient
        .from("elearning_quiz_submissions")
        .select("quiz_id")
        .eq("enrollment_id", enrollment.id)
        .eq("user_id", input.userId)
        .eq("passed", true)
        .in("quiz_id", quizIds);

      if (submissionsError) throw new Error(submissionsError.message);

      passedQuizzes = new Set((submissions || []).map((row: any) => row.quiz_id as string)).size;
    }
  }

  return {
    enrollment: enrollment as EnrollmentRow,
    totalModules: moduleIds.length,
    completedModules: (completedRows || []).length,
    totalQuizzes,
    passedQuizzes,
  };
}

export async function issueCertificateIfEligible(input: {
  userId: string;
  courseId: string;
  issuedBy?: string | null;
}): Promise<{
  issued: boolean;
  certificateId?: string;
  certificateNumber?: string;
}> {
  const completion = await getCourseCompletionState({
    userId: input.userId,
    courseId: input.courseId,
  });

  const hasAllModules =
    completion.totalModules > 0 && completion.completedModules >= completion.totalModules;
  const hasAllQuizzes =
    completion.totalQuizzes === 0 || completion.passedQuizzes >= completion.totalQuizzes;

  if (!completion.enrollment || !hasAllModules || !hasAllQuizzes) {
    return { issued: false };
  }

  const { data: existing, error: existingError } = await adminClient
    .from("certificates")
    .select("id,certificate_number")
    .eq("user_id", input.userId)
    .eq("course_id", input.courseId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) {
    return {
      issued: true,
      certificateId: existing.id,
      certificateNumber: existing.certificate_number,
    };
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("certificates")
    .insert({
      user_id: input.userId,
      course_id: input.courseId,
    } as never)
    .select("id,certificate_number,issued_at")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message || "Failed to generate certificate.");
  }

  if (input.issuedBy) {
    await adminClient.from("audit_log").insert({
      user_id: input.issuedBy,
      action: "create",
      table_name: "certificates",
      record_id: inserted.id,
      old_values: null,
      new_values: {
        user_id: input.userId,
        course_id: input.courseId,
        certificate_number: inserted.certificate_number,
      },
    } as never);
  }

  const [{ data: profile }, { data: course }, { data: usersData }] = await Promise.all([
    adminClient
      .from("profiles")
      .select("first_name,last_name")
      .eq("user_id", input.userId)
      .maybeSingle(),
    adminClient
      .from("elearning_courses")
      .select("title")
      .eq("id", input.courseId)
      .maybeSingle(),
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const userEmail =
    usersData?.users.find((candidate: any) => candidate.id === input.userId)?.email || null;

  if (userEmail && course?.title) {
    const recipientName =
      `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Participant";
    const issuedAt = new Date(inserted.issued_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    await sendEmailWithResend({
      to: userEmail,
      ...buildCertificateIssuedEmail({
        recipientName,
        recipientEmail: userEmail,
        courseTitle: course.title,
        certificateNumber: inserted.certificate_number,
        issuedAt,
      }),
    });
  }

  return {
    issued: true,
    certificateId: inserted.id,
    certificateNumber: inserted.certificate_number,
  };
}

export async function generateCertificateAsSuperAdmin(input: {
  userId: string;
  courseId: string;
}) {
  const context = await getCurrentUserContext();
  if (context.role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }

  const result = await issueCertificateIfEligible({
    userId: input.userId,
    courseId: input.courseId,
    issuedBy: context.user.id,
  });

  if (!result.issued || !result.certificateId || !result.certificateNumber) {
    throw new Error("Certificate requirements are not satisfied.");
  }

  return {
    certificateId: result.certificateId,
    certificateNumber: result.certificateNumber,
  };
}

export async function getCertificateByIdForCurrentUser(certificateId: string) {
  const context = await getCurrentUserContext();

  const { data: certificate, error } = await adminClient
    .from("certificates")
    .select("*")
    .eq("id", certificateId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!certificate) throw new Error("Certificate not found.");

  const canView =
    context.role === "super_admin" || certificate.user_id === context.user.id;

  if (!canView) throw new Error("FORBIDDEN");

  const [{ data: profile }, { data: course }] = await Promise.all([
    adminClient
      .from("profiles")
      .select("first_name,last_name")
      .eq("user_id", certificate.user_id)
      .maybeSingle(),
    adminClient
      .from("elearning_courses")
      .select("title")
      .eq("id", certificate.course_id)
      .maybeSingle(),
  ]);

  return {
    ...(certificate as CertificateRow),
    holderName:
      `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Participant",
    courseName: course?.title || "Course",
  };
}

export async function listOwnCertificates() {
  const context = await getCurrentUserContext();

  const { data, error } = await adminClient
    .from("certificates")
    .select("*")
    .eq("user_id", context.user.id)
    .order("issued_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data || []) as CertificateRow[];
  const courseIds = Array.from(new Set(rows.map((row: CertificateRow) => row.course_id)));
  if (courseIds.length === 0) {
    return [];
  }

  const { data: courses } = await adminClient
    .from("elearning_courses")
    .select("id,title")
    .in("id", courseIds);

  const titleById = new Map((courses || []).map((row: any) => [row.id as string, row.title as string]));

  return rows.map((row) => ({
    ...row,
    courseName: titleById.get(row.course_id) || "Course",
  }));
}

export async function verifyCertificate(certificateNumber: string): Promise<{
  valid: boolean;
  holderName?: string;
  courseName?: string;
  issuedAt?: string;
}> {
  const clean = certificateNumber.trim().toUpperCase();
  if (!clean) return { valid: false };

  const { data: certificate, error } = await adminClient
    .from("certificates")
    .select("user_id,course_id,issued_at")
    .eq("certificate_number", clean)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!certificate) return { valid: false };

  const [{ data: profile }, { data: course }] = await Promise.all([
    adminClient
      .from("profiles")
      .select("first_name,last_name")
      .eq("user_id", certificate.user_id)
      .maybeSingle(),
    adminClient
      .from("elearning_courses")
      .select("title")
      .eq("id", certificate.course_id)
      .maybeSingle(),
  ]);

  return {
    valid: true,
    holderName:
      `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Participant",
    courseName: course?.title || "Course",
    issuedAt: certificate.issued_at,
  };
}
