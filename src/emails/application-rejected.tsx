export interface ApplicationRejectedEmailInput {
  recipientEmail: string;
  recipientName: string;
  applicationRef: string;
  programmeName: string;
  reason?: string;
}

interface ApplicationEmailTemplate {
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

export function buildApplicationRejectedEmail({
  recipientEmail,
  recipientName,
  applicationRef,
  programmeName,
  reason,
}: ApplicationRejectedEmailInput): ApplicationEmailTemplate {
  const subject = `Application Update - ${applicationRef}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:${BRAND.canvas};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px;background:#8B4513;text-align:center;">
              <h1 style="margin:0;font-size:24px;color:#FFFFFF;font-weight:600;">${BRAND.name}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;font-size:16px;color:${BRAND.text};">Dear ${escapeHtml(recipientName)},</p>
              <p style="margin:0 0 24px;font-size:16px;color:${BRAND.textMuted};line-height:1.5;">
                Thank you for your interest. Unfortunately, your application was not successful this time.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.canvas};border-radius:8px;margin:20px 0;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0;font-size:14px;color:${BRAND.textMuted};">Application Reference</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#8B4513;">${escapeHtml(applicationRef)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px;border-top:1px solid ${BRAND.border};">
                    <p style="margin:0;font-size:14px;color:${BRAND.textMuted};">Programme</p>
                    <p style="margin:4px 0 0;font-size:16px;color:${BRAND.text};">${escapeHtml(programmeName)}</p>
                  </td>
                </tr>
                ${reason ? `
                <tr>
                  <td style="padding:16px;border-top:1px solid ${BRAND.border};">
                    <p style="margin:0;font-size:14px;color:${BRAND.textMuted};">Reason</p>
                    <p style="margin:4px 0 0;font-size:16px;color:${BRAND.text};">${escapeHtml(reason)}</p>
                  </td>
                </tr>
                ` : ""}
              </table>
              <p style="margin:24px 0 0;font-size:14px;color:${BRAND.textMuted};">
                We encourage you to apply for future programmes.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:${BRAND.canvas};text-align:center;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;font-size:12px;color:${BRAND.textMuted};">${BRAND.institution}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Dear ${recipientName},

Thank you for your interest. Unfortunately, your application was not successful this time.

Application Reference: ${applicationRef}
Programme: ${programmeName}
${reason ? `Reason: ${reason}` : ""}

We encourage you to apply for future programmes.

${BRAND.institution}`.trim();

  return { subject, html, text };
}