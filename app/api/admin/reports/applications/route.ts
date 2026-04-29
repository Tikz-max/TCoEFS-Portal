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
  const allowedRoles = ["admin", "admissions_officer", "super_admin"];
  if (!allowedRoles.includes(profile.role)) throw new Error("FORBIDDEN");
  return user;
}

export async function GET(request: Request) {
  try {
    await requireAnyAdmin();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const programmeSlug = searchParams.get("programme") || undefined;
    const status = searchParams.get("status") || undefined;

    let query = adminSupabase
      .from("applications")
      .select("*, programmes!inner(slug,title), profiles!inner(first_name,last_name,email)", { count: "exact" });

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);
    if (programmeSlug) query = query.eq("programmes.slug", programmeSlug);
    if (status) query = query.eq("status", status);

    const { data: applications, error, count } = await query.order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const statusCounts: Record<string, number> = {};
    const programmeCounts: Record<string, { total: number; title: string }> = {};
    const trendMap: Record<string, number> = {};

    for (const app of applications || []) {
      const s = app.status || "unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;

      const progSlug = app.programmes?.slug || "unknown";
      if (!programmeCounts[progSlug]) {
        programmeCounts[progSlug] = { total: 0, title: app.programmes?.title || progSlug };
      }
      programmeCounts[progSlug].total++;

      const month = app.created_at?.slice(0, 7) || "unknown";
      trendMap[month] = (trendMap[month] || 0) + 1;
    }

    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
    const byProgramme = Object.entries(programmeCounts).map(([slug, data]) => ({ slug, ...data }));
    const trend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    return NextResponse.json({
      success: true,
      data: {
        total: count || 0,
        byStatus,
        byProgramme,
        trend,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }
    console.error("Applications report error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report." }, { status: 500 });
  }
}
