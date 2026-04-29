import { config } from "dotenv";
import { Resend } from "resend";

config({ path: ".env.local" });

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_ADDRESS;
  const to = process.argv[2] || "majiboyebybit@protonmail.com";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!from) {
    throw new Error("RESEND_FROM_ADDRESS is not set");
  }

  const resend = new Resend(apiKey);
  const startedAt = Date.now();

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "TCoEFS Resend connectivity test",
    text: "If you received this, Resend API is working from the portal server.",
    html: "<p>If you received this, <strong>Resend API is working</strong> from the portal server.</p>",
  });

  if (error) {
    console.error("[test-resend] failed", {
      ms: Date.now() - startedAt,
      error,
    });
    process.exit(1);
  }

  console.log("[test-resend] success", {
    ms: Date.now() - startedAt,
    data,
    to,
    from,
  });
}

main().catch((err) => {
  console.error("[test-resend] unexpected error", err);
  process.exit(1);
});
