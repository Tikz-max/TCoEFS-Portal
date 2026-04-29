import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

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
  const allowedRoles = ["admin", "admissions_officer", "training_coordinator", "e_learning_coordinator", "super_admin"];
  if (!allowedRoles.includes(profile.role)) throw new Error("FORBIDDEN");
  return user;
}

export async function GET(request: Request) {
  try {
    await requireAnyAdmin();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const action = searchParams.get("action") || undefined;
    const table = searchParams.get("table") || undefined;
    const actor = searchParams.get("actor") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const offset = (page - 1) * limit;

    let query = adminSupabase
      .from("audit_log")
      .select("*, users!inner(email)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (action) query = query.eq("action", action);
    if (table) query = query.eq("table_name", table);
    if (actor) query = query.eq("user_id", actor);
    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);

    const { data: entries, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const auditEntries = (entries || []).map((e: any) => ({
      id: e.id,
      action: e.action,
      table: e.table_name,
      recordId: e.record_id,
      actorEmail: e.users?.email || null,
      actorId: e.user_id,
      details: e.new_data || e.old_data,
      createdAt: e.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: auditEntries,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }
    console.error("Audit log error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch audit log." }, { status: 500 });
  }
}
