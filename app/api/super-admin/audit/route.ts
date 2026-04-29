import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

const adminSupabase = adminClient as any;

async function requireSuperAdmin() {
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

  if (!profile || profile.role !== "super_admin") throw new Error("FORBIDDEN");
  return user;
}

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const action = searchParams.get("action") || undefined;
    const table = searchParams.get("table") || undefined;
    const actor = searchParams.get("actor") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const format = searchParams.get("format") || undefined;
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

    if (format === "csv") {
      const csvHeader = "ID,Action,Table,Record ID,Actor Email,Created At\n";
      const csvRows = (entries || [])
        .map((e: any) =>
          `${e.id},${e.action},${e.table_name},${e.record_id},${e.users?.email || ""},${e.created_at}`
        )
        .join("\n");

      return new NextResponse(csvHeader + csvRows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

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
      return NextResponse.json({ success: false, error: "Super admin access required." }, { status: 403 });
    }
    console.error("Super admin audit log error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch audit log." }, { status: 500 });
  }
}