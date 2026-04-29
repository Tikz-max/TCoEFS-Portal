import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

const PRIVILEGED_ROLES = new Set(["admin", "super_admin"]);

async function requireVerifierRole() {
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

  if (!profile || !PRIVILEGED_ROLES.has(profile.role)) throw new Error("FORBIDDEN");
}

export async function GET() {
  try {
    await requireVerifierRole();

    const { data: pendingProfiles, error: profilesError } = await (adminClient
      .from("profiles")
      .select("user_id,first_name,last_name,role,verification_status,created_at")
      .in("role", ["training_coordinator", "e_learning_coordinator"])
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true }) as any);

    if (profilesError) throw new Error(profilesError.message);

    const userIds = (pendingProfiles || []).map((p: any) => p.user_id);
    if (userIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: authUsers, error: authError } = await (adminClient
      .from("users")
      .select("id,email")
      .in("id", userIds) as any);

    if (authError) throw new Error(authError.message);

    const userEmailMap = new Map((authUsers || []).map((u: any) => [u.id, u.email]));

    const coordinators = (pendingProfiles || []).map((item: any) => ({
      userId: item.user_id,
      firstName: item.first_name,
      lastName: item.last_name,
      fullName: `${item.first_name} ${item.last_name}`.trim(),
      email: userEmailMap.get(item.user_id) || "",
      role: item.role,
      createdAt: item.created_at,
    }));

    return NextResponse.json({ success: true, data: coordinators });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Admin or super admin access required." }, { status: 403 });
    }
    console.error("List pending coordinators error:", error);
    return NextResponse.json({ success: false, error: "Failed to load pending coordinators." }, { status: 500 });
  }
}
