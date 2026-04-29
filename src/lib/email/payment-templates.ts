export interface PaymentApprovedEmailInput {
  recipientEmail: string;
  recipientName: string;
  applicationRef: string;
  amount: string;
  paidAt: string;
}

export interface PaymentRejectedEmailInput {
  recipientEmail: string;
  recipientName: string;
  applicationRef: string;
  amount: string;
  paidAt: string;
  reason?: string;
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

export function buildPaymentApprovedEmail({
  recipientEmail,
  recipientName,
  applicationRef,
  amount,
  paidAt,
}: PaymentApprovedEmailInput): PaymentEmailTemplate {
  const safeName = escapeHtml(recipientName);
  const safeRef = escapeHtml(applicationRef);
  const safeAmount = escapeHtml(amount);
  const safeDate = escapeHtml(paidAt);

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
                <div style="width:48px;height:48px;border-radius:50%;background:#DCFCE7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:${BRAND.text};text-align:center;">Payment Confirmed</h1>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${BRAND.textMuted};text-align:center;">
                  Your payment has been verified and approved.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.canvas};border-radius:8px;margin:20px 0;">
                  <tr>
                    <td style="padding:16px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:8px 0;font-size:13px;color:${BRAND.textMuted};">Applicant</td>
                          <td style="padding:8px 0;font-size:13px;font-weight:600;color:${BRAND.text};text-align:right;">${safeName}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;font-size:13px;color:${BRAND.textMuted};">Application Ref</td>
                          <td style="padding:8px 0;font-size:13px;font-weight:600;color:${BRAND.text};text-align:right;">${safeRef}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;font-size:13px;color:${BRAND.textMuted};">Amount Paid</td>
                          <td style="padding:8px 0;font-size:13px;font-weight:600;color:${BRAND.text};text-align:right;">${safeAmount}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;font-size:13px;color:${BRAND.textMuted};">Date Paid</td>
                          <td style="padding:8px 0;font-size:13px;font-weight:600;color:${BRAND.text};text-align:right;">${safeDate}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.textMuted};">
                  Your application will now proceed to the review stage. You will receive further notifications regarding the outcome.
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

  const text = `Payment Confirmed

Your payment has been verified and approved.

Applicant: ${recipientName}
Application Ref: ${applicationRef}
Amount Paid: ${amount}
Date Paid: ${paidAt}

Your application will now proceed to the review stage. You will receive further notifications regarding the outcome.`;

  return {
    subject: `Payment Confirmed - ${applicationRef}`,
    html,
    text,
  };
}

export function buildPaymentRejectedEmail({
  recipientEmail,
  recipientName,
  applicationRef,
  amount,
  paidAt,
  reason,
}: PaymentRejectedEmailInput): PaymentEmailTemplate {
  const safeName = escapeHtml(recipientName);
  const safeRef = escapeHtml(applicationRef);
  const safeAmount = escapeHtml(amount);
  const safeDate = escapeHtml(paidAt);
  const safeReason = reason ? escapeHtml(reason) : "The payment receipt could not be verified.";

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
                <div style="width:48px;height:48px;border-radius:50%;background:#FEE2E2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#991B1B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:${BRAND.text};text-align:center;">Payment Not Approved</h1>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${BRAND.textMuted};text-align:center;">
                  Your payment could not be verified.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.canvas};border-radius:8px;margin:20px 0;">
                  <tr>
                    <td style="padding:16px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:8px 0;font-size:13px;color:${BRAND.textMuted};">Applicant</td>
                          <td style="padding:8px 0;font-size:13px;font-weight:600;color:${BRAND.text};text-align:right;">${safeName}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;font-size:13px;color:${BRAND.textMuted};">Application Ref</td>
                          <td style="padding:8px 0;font-size:13px;font-weight:600;color:${BRAND.text};text-align:right;">${safeRef}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;font-size:13px;color:${BRAND.textMuted};">Amount</td>
                          <td style="padding:8px 0;font-size:13px;font-weight:600;color:${BRAND.text};text-align:right;">${safeAmount}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;font-size:13px;color:${BRAND.textMuted};">Date Paid</td>
                          <td style="padding:8px 0;font-size:13px;font-weight:600;color:${BRAND.text};text-align:right;">${safeDate}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <div style="background:#FEF3C7;border-radius:8px;padding:16px;margin:20px 0;">
                  <div style="font-size:11px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Reason</div>
                  <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5;">${safeReason}</p>
                </div>
                <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.textMuted};">
                  Please contact the Admissions Office or resubmit your payment receipt with correct details.
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

  const text = `Payment Not Approved

Your payment could not be verified.

Applicant: ${recipientName}
Application Ref: ${applicationRef}
Amount: ${amount}
Date Paid: ${paidAt}

Reason: ${reason || "The payment receipt could not be verified."}

Please contact the Admissions Office or resubmit your payment receipt with correct details.`;

  return {
    subject: `Payment Not Approved - ${applicationRef}`,
    html,
    text,
  };
}