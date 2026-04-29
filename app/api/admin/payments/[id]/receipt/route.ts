import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generatePresignedReadUrl } from "@/lib/storage/upload";

const ALLOWED_ADMIN_ROLES = new Set([
  "admin",
  "admissions_officer",
  "training_coordinator",
  "super_admin",
]);

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("UNAUTHENTICATED");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();

  if (error) throw new Error(error.message);
  if (!profile || !ALLOWED_ADMIN_ROLES.has(profile.role)) {
    throw new Error("FORBIDDEN");
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser();
    const { id } = await context.params;

    const { data, error } = await adminClient
      .from("payments")
      .select("receipt_storage_path")
      .eq("id", id)
      .maybeSingle<{ receipt_storage_path: string | null }>();

    if (error) throw new Error(error.message);
    if (!data || !data.receipt_storage_path) {
      return NextResponse.json(
        { success: false, error: "Receipt not found for this payment." },
        { status: 404 }
      );
    }

    const receiptUrl = await generatePresignedReadUrl({
      key: data.receipt_storage_path,
      expiresIn: 60 * 5,
    });

    return NextResponse.json({ success: true, data: { receiptUrl } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "You are not allowed to view payment receipts." },
        { status: 403 }
      );
    }

    console.error("Admin payment receipt API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to fetch receipt URL.",
      },
      { status: 500 }
    );
  }
}
