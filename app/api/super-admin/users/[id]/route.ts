import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const adminSupabase = adminClient as any;

const SYSTEM_ROLES = new Set(["participant", "instructor", "training_coordinator", "e_learning_coordinator", "admissions_officer", "admin", "super_admin"]);

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

const updateUserSchema = z.object({
  role: z.enum(["participant", "instructor", "training_coordinator", "e_learning_coordinator", "admissions_officer", "admin", "super_admin"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
}).refine(data => data.role || data.status, { message: "At least role or status required" });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await requireSuperAdmin();
    const { id: userId } = await params;

    const input = updateUserSchema.parse(await request.json());

    const { data: targetProfile } = await (adminSupabase
      .from("profiles")
      .select("user_id, role")
      .eq("user_id", userId)
      .maybeSingle() as any);

    if (!targetProfile) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (input.role) {
      if (input.role === "super_admin" && targetProfile.user_id === currentUser.id) {
        return NextResponse.json({ success: false, error: "Cannot demote yourself." }, { status: 400 });
      }
      if (targetProfile.role === "super_admin" && input.role !== "super_admin") {
        return NextResponse.json({ success: false, error: "Cannot modify super admin role." }, { status: 403 });
      }

      await adminSupabase.from("profiles").update({ role: input.role }).eq("user_id", userId);
    }

    if (input.status) {
      if (input.status === "suspended" && targetProfile.user_id === currentUser.id) {
        return NextResponse.json({ success: false, error: "Cannot suspend yourself." }, { status: 400 });
      }

      await adminSupabase.from("profiles").update({ status: input.status }).eq("user_id", userId);
    }

    return NextResponse.json({ success: true, data: { userId, ...input } });
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
    console.error("Update user error:", error);
    return NextResponse.json({ success: false, error: "Failed to update user." }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id: userId } = await params;

    const { data: profile } = await (adminSupabase
      .from("profiles")
      .select("*, users!inner(email,created_at)")
      .eq("user_id", userId)
      .maybeSingle() as any);

    if (!profile) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.user_id,
        email: profile.users?.email || null,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role,
        status: profile.status,
        createdAt: profile.users?.created_at,
        updatedAt: profile.updated_at,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Super admin access required." }, { status: 403 });
    }
    console.error("Get user error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch user." }, { status: 500 });
  }
}
