export interface PaymentReferenceEmailInput {
  recipientEmail: string;
  recipientName: string;
  applicationRef: string;
  amount: string;
  paymentRef: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

interface PaymentEmailTemplate {
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

export function buildPaymentReferenceEmail({
  recipientEmail,
  recipientName,
  applicationRef,
  amount,
  paymentRef,
  bankDetails,
}: PaymentReferenceEmailInput): PaymentEmailTemplate {
  const subject = `Payment Instructions - ${applicationRef}`;
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
            <td style="padding:24px;background:${BRAND.primary};text-align:center;">
              <h1 style="margin:0;font-size:24px;color:#FFFFFF;font-weight:600;">${BRAND.name}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;font-size:16px;color:${BRAND.text};">Dear ${escapeHtml(recipientName)},</p>
              <p style="margin:0 0 24px;font-size:16px;color:${BRAND.textMuted};line-height:1.5;">
                Please find below the payment instructions for your application.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.canvas};border-radius:8px;margin:20px 0;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0;font-size:14px;color:${BRAND.textMuted};">Application Reference</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:${BRAND.primary};">${escapeHtml(applicationRef)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px;border-top:1px solid ${BRAND.border};">
                    <p style="margin:0;font-size:14px;color:${BRAND.textMuted};">Amount</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:${BRAND.text};">${escapeHtml(amount)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px;border-top:1px solid ${BRAND.border};">
                    <p style="margin:0;font-size:14px;color:${BRAND.textMuted};">Payment Reference</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:${BRAND.text};">${escapeHtml(paymentRef)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 16px;font-size:14px;color:${BRAND.textMuted};font-weight:600;">Bank Details:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.border};border-radius:8px;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};">
                    <p style="margin:0;font-size:14px;color:${BRAND.textMuted};">Bank Name</p>
                    <p style="margin:4px 0 0;font-size:16px;color:${BRAND.text};">${escapeHtml(bankDetails.bankName)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};">
                    <p style="margin:0;font-size:14px;color:${BRAND.textMuted};">Account Number</p>
                    <p style="margin:4px 0 0;font-size:16px;color:${BRAND.text};">${escapeHtml(bankDetails.accountNumber)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0;font-size:14px;color:${BRAND.textMuted};">Account Name</p>
                    <p style="margin:4px 0 0;font-size:16px;color:${BRAND.text};">${escapeHtml(bankDetails.accountName)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:14px;color:${BRAND.textMuted};">
                Please make payment and retain your receipt. Payment verification may take 2-3 business days.
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

Please find below the payment instructions for your application.

Application Reference: ${applicationRef}
Amount: ${amount}
Payment Reference: ${paymentRef}

Bank Details:
Bank Name: ${bankDetails.bankName}
Account Number: ${bankDetails.accountNumber}
Account Name: ${bankDetails.accountName}

Please make payment and retain your receipt. Payment verification may take 2-3 business days.

${BRAND.institution}`.trim();

  return { subject, html, text };
}