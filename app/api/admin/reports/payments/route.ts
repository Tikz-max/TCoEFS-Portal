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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = adminSupabase
      .from("payments")
      .select("*, programmes!inner(slug,title)", { count: "exact" });

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);

    const { data: payments, error, count } = await query.order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const statusCounts: Record<string, number> = {};
    const programmeCounts: Record<string, { total: number; title: string; amount: number }> = {};
    const monthlyTrend: Record<string, number> = {};
    let totalCollected = 0;

    for (const p of payments || []) {
      const s = p.status || "unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;

      if (p.status === "verified") {
        totalCollected += p.amount || 0;
        const progSlug = p.programmes?.slug || "unknown";
        if (!programmeCounts[progSlug]) {
          programmeCounts[progSlug] = { total: 0, title: p.programmes?.title || progSlug, amount: 0 };
        }
        programmeCounts[progSlug].total++;
        programmeCounts[progSlug].amount += p.amount || 0;
      }

      const month = p.created_at?.slice(0, 7) || "unknown";
      if (p.status === "verified") {
        monthlyTrend[month] = (monthlyTrend[month] || 0) + (p.amount || 0);
      }
    }

    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
    const byProgramme = Object.entries(programmeCounts).map(([slug, data]) => ({ slug, ...data }));
    const trend = Object.entries(monthlyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));

    return NextResponse.json({
      success: true,
      data: {
        totalCollected,
        totalPayments: count || 0,
        byStatus,
        byProgramme,
        monthlyTrend: trend,
      },
    });
} catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }
    console.error("Payments report error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report." }, { status: 500 });
  }
}
