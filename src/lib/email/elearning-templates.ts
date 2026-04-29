interface ElearningEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface ElearningEnrolledEmailInput {
  recipientName: string;
  recipientEmail: string;
  courseTitle: string;
}

export interface CertificateIssuedEmailInput {
  recipientName: string;
  recipientEmail: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: string;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildElearningEnrolledEmail(
  input: ElearningEnrolledEmailInput
): ElearningEmailTemplate {
  const recipient = escapeHtml(input.recipientName);
  const course = escapeHtml(input.courseTitle);

  const html = `
  <html>
    <body style="font-family: Arial, Helvetica, sans-serif; background:#f5f9f5; color:#111b11; margin:0; padding:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border:1px solid #d8e4d8; border-radius:12px; overflow:hidden;">
              <tr>
                <td style="padding:20px 24px; background:linear-gradient(180deg,#3d7a3d,#2d5a2d); color:#ffffff;">
                  <div style="font-size:20px; font-weight:700;">TCoEFS Portal</div>
                  <div style="font-size:12px; opacity:0.85; margin-top:4px;">University of Jos</div>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <h1 style="margin:0 0 12px; font-size:22px;">Enrollment Confirmed</h1>
                  <p style="margin:0 0 16px; font-size:14px; color:#526052; line-height:1.6;">
                    Hello ${recipient}, you have been successfully enrolled in the e-learning course below.
                  </p>
                  <div style="background:#eff3ef; border-radius:8px; padding:14px 16px; margin:0 0 18px;">
                    <div style="font-size:12px; color:#526052; margin-bottom:6px;">Course</div>
                    <div style="font-size:15px; font-weight:700; color:#111b11;">${course}</div>
                  </div>
                  <p style="margin:0; font-size:13px; color:#526052; line-height:1.6;">
                    You can now access your learning dashboard to start modules and quizzes.
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

  const text = `Enrollment Confirmed

Hello ${input.recipientName},

You have been successfully enrolled in: ${input.courseTitle}.
You can now access your learning dashboard to start modules and quizzes.`;

  return {
    subject: `Enrollment Confirmed - ${input.courseTitle}`,
    html,
    text,
  };
}

export function buildCertificateIssuedEmail(
  input: CertificateIssuedEmailInput
): ElearningEmailTemplate {
  const recipient = escapeHtml(input.recipientName);
  const course = escapeHtml(input.courseTitle);
  const certificateNumber = escapeHtml(input.certificateNumber);
  const issuedAt = escapeHtml(input.issuedAt);

  const html = `
  <html>
    <body style="font-family: Arial, Helvetica, sans-serif; background:#f5f9f5; color:#111b11; margin:0; padding:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border:1px solid #d8e4d8; border-radius:12px; overflow:hidden;">
              <tr>
                <td style="padding:20px 24px; background:linear-gradient(180deg,#3d7a3d,#2d5a2d); color:#ffffff;">
                  <div style="font-size:20px; font-weight:700;">TCoEFS Portal</div>
                  <div style="font-size:12px; opacity:0.85; margin-top:4px;">University of Jos</div>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <h1 style="margin:0 0 12px; font-size:22px;">Certificate Issued</h1>
                  <p style="margin:0 0 16px; font-size:14px; color:#526052; line-height:1.6;">
                    Congratulations ${recipient}. Your certificate has been issued for successful completion of this course.
                  </p>
                  <div style="background:#eff3ef; border-radius:8px; padding:14px 16px; margin:0 0 10px;">
                    <div style="font-size:12px; color:#526052; margin-bottom:6px;">Course</div>
                    <div style="font-size:15px; font-weight:700; color:#111b11;">${course}</div>
                  </div>
                  <div style="background:#eff3ef; border-radius:8px; padding:14px 16px; margin:0 0 18px;">
                    <div style="font-size:12px; color:#526052; margin-bottom:6px;">Certificate Number</div>
                    <div style="font-size:15px; font-weight:700; color:#111b11;">${certificateNumber}</div>
                    <div style="font-size:12px; color:#526052; margin-top:8px;">Issued: ${issuedAt}</div>
                  </div>
                  <p style="margin:0; font-size:13px; color:#526052; line-height:1.6;">
                    You can view this certificate from your e-learning certificates page.
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

  const text = `Certificate Issued

Congratulations ${input.recipientName}.

Course: ${input.courseTitle}
Certificate Number: ${input.certificateNumber}
Issued: ${input.issuedAt}

You can view this certificate from your e-learning certificates page.`;

  return {
    subject: `Certificate Issued - ${input.courseTitle}`,
    html,
    text,
  };
}
