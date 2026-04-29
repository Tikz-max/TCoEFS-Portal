import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const adminSupabase = adminClient as any;

async function requireSystemAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

const emailTemplates = {
  "application-submitted": async (data: any) => {
    const { buildApplicationSubmittedEmail } = await import("@/emails/application-submitted");
    return buildApplicationSubmittedEmail(data);
  },
  "application-approved": async (data: any) => {
    const { buildApplicationApprovedEmail } = await import("@/emails/application-approved");
    return buildApplicationApprovedEmail(data);
  },
  "application-rejected": async (data: any) => {
    const { buildApplicationRejectedEmail } = await import("@/emails/application-rejected");
    return buildApplicationRejectedEmail(data);
  },
  "payment-reference": async (data: any) => {
    const { buildPaymentReferenceEmail } = await import("@/emails/payment-reference");
    return buildPaymentReferenceEmail(data);
  },
  "payment-verified": async (data: any) => {
    const { buildPaymentApprovedEmail } = await import("@/lib/email/payment-templates");
    return buildPaymentApprovedEmail(data);
  },
  "training-confirmed": async (data: any) => {
    const { buildTrainingConfirmedEmail } = await import("@/emails/training-confirmed");
    return buildTrainingConfirmedEmail(data);
  },
  "elearning-enrolled": async (data: any) => {
    const { buildElearningEnrolledEmail } = await import("@/emails/elearning-enrolled");
    return buildElearningEnrolledEmail(data);
  },
  "certificate-issued": async (data: any) => {
    const { buildCertificateIssuedEmail } = await import("@/emails/certificate-issued");
    return buildCertificateIssuedEmail(data);
  },
  "account-created": async (data: any) => {
    const { buildAccountCreatedEmail } = await import("@/emails/account-created");
    return buildAccountCreatedEmail(data);
  },
} as const;

const sendEmailSchema = z.object({
  to: z.string().email(),
  template: z.enum([
    "application-submitted",
    "application-approved",
    "application-rejected",
    "payment-reference",
    "payment-verified",
    "training-confirmed",
    "elearning-enrolled",
    "certificate-issued",
    "account-created",
  ]),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  try {
    await requireSystemAuth();
    const input = sendEmailSchema.parse(await request.json());

    const builder = emailTemplates[input.template];
    if (!builder) {
      return NextResponse.json({ success: false, error: "Unknown template." }, { status: 400 });
    }

    const template = await builder(input.data);

    await adminSupabase.from("email_queue").insert({
      to_email: input.to,
      subject: template.subject,
      body: template.html,
      status: "pending",
      template: input.template,
    });

    return NextResponse.json({ success: true, message: "Email queued." });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    console.error("Email API error:", error);
    return NextResponse.json({ success: false, error: "Failed to queue email." }, { status: 500 });
  }
}