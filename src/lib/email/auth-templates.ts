type AuthEmailAction =
  | "signup"
  | "recovery"
  | "magiclink"
  | "invite"
  | "email_change"
  | string;

interface AuthEmailTemplateInput {
  actionType: AuthEmailAction;
  recipientEmail: string;
  actionLink?: string;
  otpCode?: string;
}

interface AuthEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const BRAND = {
  name: "TCoEFS Portal",
  institution: "University of Jos",
  primary: "#2D5A2D",
  primaryAlt: "#3D7A3D",
  text: "#111B11",
  textMuted: "#526052",
  border: "#D8E4D8",
  canvas: "#F5F9F5",
};

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getActionCopy(actionType: AuthEmailAction): {
  title: string;
  subject: string;
  description: string;
  ctaLabel: string;
} {
  switch (actionType) {
    case "signup":
      return {
        title: "Verify your email address",
        subject: "Verify your TCoEFS Portal account",
        description:
          "Thanks for registering. Confirm your email to activate your account.",
        ctaLabel: "Verify email",
      };
    case "recovery":
      return {
        title: "Reset your password",
        subject: "Reset your TCoEFS Portal password",
        description:
          "A password reset was requested for your account. Use the button below to continue.",
        ctaLabel: "Reset password",
      };
    case "magiclink":
      return {
        title: "Sign in to your account",
        subject: "Your TCoEFS Portal sign-in link",
        description: "Use the secure sign-in link below to access your account.",
        ctaLabel: "Sign in",
      };
    case "invite":
      return {
        title: "You were invited",
        subject: "You were invited to TCoEFS Portal",
        description:
          "You have been invited to access the TCoEFS Portal. Use the button below to accept.",
        ctaLabel: "Accept invite",
      };
    case "email_change":
      return {
        title: "Confirm your email change",
        subject: "Confirm your TCoEFS email change",
        description: "Confirm this email change request to keep your account secure.",
        ctaLabel: "Confirm change",
      };
    default:
      return {
        title: "Account notification",
        subject: "TCoEFS account notification",
        description:
          "We processed a security-related action for your TCoEFS account.",
        ctaLabel: "Open portal",
      };
  }
}

export function buildAuthEmailTemplate({
  actionType,
  recipientEmail,
  actionLink,
  otpCode,
}: AuthEmailTemplateInput): AuthEmailTemplate {
  const copy = getActionCopy(actionType);
  const safeRecipient = escapeHtml(recipientEmail);
  const safeLink = actionLink ? escapeHtml(actionLink) : undefined;
  const safeOtp = otpCode ? escapeHtml(otpCode) : undefined;

  const html = `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:${BRAND.canvas};font-family:Arial,Helvetica,sans-serif;color:${BRAND.text};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:linear-gradient(180deg, ${BRAND.primaryAlt}, ${BRAND.primary});color:#FFFFFF;">
                <div style="font-size:20px;font-weight:700;line-height:1.2;">${BRAND.name}</div>
                <div style="font-size:12px;opacity:0.85;margin-top:4px;">${BRAND.institution}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:${BRAND.text};">${copy.title}</h1>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${BRAND.textMuted};">
                  ${copy.description}
                </p>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:${BRAND.textMuted};">
                  Account: <strong style="color:${BRAND.text};">${safeRecipient}</strong>
                </p>
                ${safeLink ? `<p style="margin:0 0 18px;"><a href="${safeLink}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:${BRAND.primary};color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;">${copy.ctaLabel}</a></p>` : ""}
                ${safeOtp ? `<p style="margin:0 0 12px;font-size:13px;color:${BRAND.textMuted};">Or use this code:</p><p style="margin:0 0 18px;font-size:20px;letter-spacing:2px;font-weight:700;color:${BRAND.text};">${safeOtp}</p>` : ""}
                ${safeLink ? `<p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:${BRAND.textMuted};word-break:break-all;">If the button does not work, copy and paste this link:<br />${safeLink}</p>` : ""}
                <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.textMuted};">
                  If you did not initiate this action, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  const textLines = [
    `${copy.title}`,
    "",
    copy.description,
    "",
    `Account: ${recipientEmail}`,
  ];

  if (actionLink) {
    textLines.push("", `${copy.ctaLabel}: ${actionLink}`);
  }

  if (otpCode) {
    textLines.push("", `Code: ${otpCode}`);
  }

  textLines.push(
    "",
    "If you did not initiate this action, you can ignore this email."
  );

  return {
    subject: copy.subject,
    html,
    text: textLines.join("\n"),
  };
}
