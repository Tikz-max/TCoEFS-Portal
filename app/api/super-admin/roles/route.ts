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

export async function GET() {
  try {
    await requireSuperAdmin();

    const { data: roles, error } = await adminSupabase
      .from("roles")
      .select("*, role_permissions(*)")
      .order("is_system", { ascending: false })
      .order("name");

    if (error) throw new Error(error.message);

    const filtered = (roles || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.is_system,
      permissions: (r.role_permissions || []).map((p: any) => p.permission),
    }));

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Super admin access required." }, { status: 403 });
    }
    console.error("Roles list error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch roles." }, { status: 500 });
  }
}

const createRoleSchema = z.object({
  name: z.string().min(3).max(50).regex(/^[a-z_]+$/, "lowercase letters and underscores only"),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().regex(/^[a-z_:]+$/)).default([]),
});

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();

    const input = createRoleSchema.parse(await request.json());

    const { data: existing } = await (adminSupabase
      .from("roles")
      .select("id")
      .eq("name", input.name)
      .maybeSingle() as any);

    if (existing) {
      return NextResponse.json({ success: false, error: "Role already exists." }, { status: 409 });
    }

    const { data: role, error } = await adminSupabase
      .from("roles")
      .insert({ name: input.name, description: input.description || null, is_system: false })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    if (input.permissions.length > 0) {
      const perms = input.permissions.map((p: string) => ({
        role_id: role.id,
        permission: p,
      }));
      await adminSupabase.from("role_permissions").insert(perms);
    }

    return NextResponse.json({
      success: true,
      data: { id: role.id, name: input.name, permissions: input.permissions },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Super admin access required." }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create role error:", error);
    return NextResponse.json({ success: false, error: "Failed to create role." }, { status: 500 });
  }
}