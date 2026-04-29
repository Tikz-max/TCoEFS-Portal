import { Resend } from "resend";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  return new Resend(apiKey);
}

function getFromAddress(): string {
  const fromAddress = process.env.RESEND_FROM_ADDRESS;
  if (!fromAddress) {
    throw new Error("RESEND_FROM_ADDRESS is not set");
  }

  return fromAddress;
}

export async function sendEmailWithResend({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();

    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
