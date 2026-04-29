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
  const allowedRoles = ["admin", "admissions_officer", "training_coordinator", "super_admin"];
  if (!allowedRoles.includes(profile.role)) throw new Error("FORBIDDEN");
  return user;
}

export async function GET(request: Request) {
  try {
    await requireAnyAdmin();

    const { data: programmes } = await (adminSupabase
      .from("programmes")
      .select("id,slug,title,total_fee,currency")
      .eq("status", "published")
      .order("title") as any);

    const enrollmentCounts: Record<string, number> = {};
    const revenueMap: Record<string, number> = {};
    const completionMap: Record<string, number> = {};

    for (const prog of programmes || []) {
      const { count: enrollCount } = await (adminSupabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("programme_id", prog.id) as any);

      const { data: payments } = await (adminSupabase
        .from("payments")
        .select("amount, status")
        .eq("programme_id", prog.id)
        .eq("status", "verified") as any);

      const revenue = (payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      revenueMap[prog.slug] = revenue;
      enrollmentCounts[prog.slug] = enrollCount || 0;

      const { count: completeCount } = await (adminSupabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("programme_id", prog.id)
        .eq("status", "completed") as any);

      completionMap[prog.slug] = enrollCount && enrollCount > 0 ? Math.round((completeCount || 0) / enrollCount * 100) : 0;
    }

    const programmesData = (programmes || []).map((prog: any) => ({
      slug: prog.slug,
      title: prog.title,
      fee: prog.total_fee,
      currency: prog.currency,
      enrollmentCount: enrollmentCounts[prog.slug] || 0,
      revenue: revenueMap[prog.slug] || 0,
      completionRate: completionMap[prog.slug] || 0,
    }));

    const totalEnrollments = Object.values(enrollmentCounts).reduce((a, b) => a + b, 0);
    const totalRevenue = Object.values(revenueMap).reduce((a, b) => a + b, 0);
    const avgCompletion = programmesData.length > 0
      ? Math.round(programmesData.reduce((sum: number, p: any) => sum + p.completionRate, 0) / programmesData.length)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        programmes: programmesData,
        totalEnrollments,
        totalRevenue,
        avgCompletionRate: avgCompletion,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }
    console.error("Training report error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report." }, { status: 500 });
  }
}
