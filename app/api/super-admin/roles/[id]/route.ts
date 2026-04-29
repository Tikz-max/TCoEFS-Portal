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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id: roleId } = await params;

    const { data: role } = await (adminSupabase
      .from("roles")
      .select("*, role_permissions(*)")
      .eq("id", roleId)
      .maybeSingle() as any);

    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.is_system,
        permissions: (role.role_permissions || []).map((p: any) => p.permission),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Super admin access required." }, { status: 403 });
    }
    console.error("Get role error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch role." }, { status: 500 });
  }
}

const updateRoleSchema = z.object({
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().regex(/^[a-z_:]+$/)).optional(),
}).refine(data => data.description || data.permissions, { message: "At least description or permissions required" });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id: roleId } = await params;
    const input = updateRoleSchema.parse(await request.json());

    const { data: role } = await (adminSupabase
      .from("roles")
      .select("is_system")
      .eq("id", roleId)
      .maybeSingle() as any);

    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found." }, { status: 404 });
    }
    if (role.is_system) {
      return NextResponse.json({ success: false, error: "Cannot modify system roles." }, { status: 403 });
    }

    if (input.description !== undefined) {
      await adminSupabase.from("roles").update({ description: input.description }).eq("id", roleId);
    }

    if (input.permissions !== undefined) {
      await adminSupabase.from("role_permissions").delete().eq("role_id", roleId);
      if (input.permissions.length > 0) {
        const perms = input.permissions.map((p: string) => ({
          role_id: roleId,
          permission: p,
        }));
        await adminSupabase.from("role_permissions").insert(perms);
      }
    }

    return NextResponse.json({ success: true, data: { roleId, ...input } });
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
    console.error("Update role error:", error);
    return NextResponse.json({ success: false, error: "Failed to update role." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id: roleId } = await params;

    const { data: role } = await (adminSupabase
      .from("roles")
      .select("is_system, name")
      .eq("id", roleId)
      .maybeSingle() as any);

    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found." }, { status: 404 });
    }
    if (role.is_system) {
      return NextResponse.json({ success: false, error: "Cannot delete system roles." }, { status: 403 });
    }

    const { count } = await (adminSupabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", role.name) as any);

    if (count && count > 0) {
      return NextResponse.json({ success: false, error: `Role is assigned to ${count} user(s).` }, { status: 409 });
    }

    await adminSupabase.from("role_permissions").delete().eq("role_id", roleId);
    await adminSupabase.from("roles").delete().eq("id", roleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Super admin access required." }, { status: 403 });
    }
    console.error("Delete role error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete role." }, { status: 500 });
  }
}