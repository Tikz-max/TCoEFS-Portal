import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { z } from "zod";

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

const userFiltersSchema = z.object({
  page: z.string().default("1"),
  limit: z.string().default("20"),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const input = userFiltersSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      status: searchParams.get("status") || undefined,
    });

    const page = Number(input.page);
    const limit = Math.min(Number(input.limit) as number, 100);
    const offset = (page - 1) * limit;

    let query = adminSupabase
      .from("profiles")
      .select("*, users!inner(email,created_at)", { count: "exact" });

    if (input.search) {
      query = query.or(
        `first_name.ilike.%${input.search}%,last_name.ilike.%${input.search}%,users.email.ilike.%${input.search}%`
      );
    }
    if (input.role) {
      query = query.eq("role", input.role);
    }
    if (input.status) {
      query = query.eq("status", input.status === "active" ? "active" : "suspended");
    }

    const { data: usersData, error, count } = await query
      .order("users.created_at", { ascending: false })
      .range(offset as number, (offset + limit - 1) as number);

    if (error) throw new Error(error.message);

    const users = (usersData || []).map((u: any) => ({
      id: u.user_id,
      email: u.users?.email || null,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role,
      status: u.status,
      createdAt: u.users?.created_at,
      updatedAt: u.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page: page,
        limit: limit,
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
    console.error("Super admin users list error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users." }, { status: 500 });
  }
}