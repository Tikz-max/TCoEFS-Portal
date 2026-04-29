import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmailWithResend } from "@/lib/email/resend";

const PRIVILEGED_ROLES = new Set(["admin", "super_admin"]);

async function requireVerifierRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const { data: profile } = await (supabase
    .from("profiles")
    .select("role,first_name,last_name")
    .eq("user_id", user.id)
    .maybeSingle() as any);

  if (!profile || !PRIVILEGED_ROLES.has(profile.role)) throw new Error("FORBIDDEN");
  return {
    fullName: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Admin",
  };
}

export async function POST(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const verifier = await requireVerifierRole();
    const { userId } = await params;

    const { data: target, error: targetError } = await (adminClient
      .from("profiles")
      .select("user_id,first_name,last_name,role,verification_status,users!inner(email)")
      .eq("user_id", userId)
      .maybeSingle() as any);

    if (targetError) throw new Error(targetError.message);
    if (!target) {
      return NextResponse.json({ success: false, error: "Coordinator not found." }, { status: 404 });
    }

    if (!["training_coordinator", "e_learning_coordinator"].includes(target.role)) {
      return NextResponse.json({ success: false, error: "Only coordinators can be verified." }, { status: 400 });
    }

    if (target.verification_status === "approved") {
      return NextResponse.json({ success: true, data: { userId, alreadyApproved: true } });
    }

    const { error: updateError } = await ((adminClient as any)
      .from("profiles")
      .update({ verification_status: "approved" })
      .eq("user_id", userId) as any);
    if (updateError) throw new Error(updateError.message);

    const recipientEmail = target.users?.email;
    if (recipientEmail) {
      const coordinatorName = `${target.first_name || ""} ${target.last_name || ""}`.trim() || "Coordinator";
      const roleLabel =
        target.role === "training_coordinator" ? "Training Coordinator" : "E-Learning Coordinator";

      await sendEmailWithResend({
        to: recipientEmail,
        subject: "TCoEFS Coordinator Account Approved",
        html: `<p>Hello ${coordinatorName},</p><p>Your ${roleLabel} account on the TCoEFS Portal has been approved by ${verifier.fullName}.</p><p>You can now sign in at <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login">${process.env.NEXT_PUBLIC_SITE_URL}/login</a>.</p><p>Regards,<br/>TCoEFS Portal Team</p>`,
        text: `Hello ${coordinatorName},\n\nYour ${roleLabel} account on the TCoEFS Portal has been approved by ${verifier.fullName}.\n\nYou can now sign in at ${process.env.NEXT_PUBLIC_SITE_URL}/login\n\nRegards,\nTCoEFS Portal Team`,
      });
    }

    return NextResponse.json({ success: true, data: { userId, approved: true } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Admin or super admin access required." }, { status: 403 });
    }
    console.error("Verify coordinator error:", error);
    return NextResponse.json({ success: false, error: "Failed to verify coordinator." }, { status: 500 });
  }
}
