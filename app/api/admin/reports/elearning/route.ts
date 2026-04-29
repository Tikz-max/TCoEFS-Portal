import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const adminSupabase = adminClient as any;

async function requireAnyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const { data: profile } = await (supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle() as any);

  if (!profile) throw new Error("FORBIDDEN");
  const allowedRoles = ["admin", "admissions_officer", "e_learning_coordinator", "super_admin"];
  if (!allowedRoles.includes(profile.role)) throw new Error("FORBIDDEN");
  return user;
}

export async function GET(request: Request) {
  try {
    await requireAnyAdmin();

    const { data: courses } = await (adminSupabase
      .from("elearning_courses")
      .select("id,slug,title,status")
      .order("title") as any);

    const courseStats: Record<string, { enrollmentCount: number; completionRate: number }> = {};

    for (const course of courses || []) {
      const { count: enrollCount } = await (adminSupabase
        .from("elearning_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("course_id", course.id) as any);

      const { count: completeCount } = await (adminSupabase
        .from("elearning_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("course_id", course.id)
        .eq("completed_modules_count") as any);

      courseStats[course.id] = {
        enrollmentCount: enrollCount || 0,
        completionRate: enrollCount && enrollCount > 0 ? Math.round((completeCount || 0) / enrollCount * 100) : 0,
      };
    }

    const coursesData = (courses || []).map((c: any) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      status: c.status,
      enrollmentCount: courseStats[c.id]?.enrollmentCount || 0,
      completionRate: courseStats[c.id]?.completionRate || 0,
    }));

    const totalEnrollments = Object.values(courseStats).reduce((sum: number, s) => sum + s.enrollmentCount, 0);
    const avgCompletion = coursesData.length > 0
      ? Math.round(coursesData.reduce((sum: number, c: any) => sum + c.completionRate, 0) / coursesData.length)
      : 0;

    const popularCourses = [...coursesData].sort((a, b) => b.enrollmentCount - a.enrollmentCount).slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        courses: coursesData,
        totalEnrollments,
        avgCompletionRate: avgCompletion,
        popularCourses,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }
    console.error("Elearning report error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report." }, { status: 500 });
  }
}
