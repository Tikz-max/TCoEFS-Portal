import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 client.
 *
 * R2 is S3-compatible, so we use the AWS SDK pointed at the R2 endpoint.
 *
 * Two buckets are configured:
 * - Public bucket (PUBLIC_R2_*): non-sensitive assets (thumbnails, public images)
 * - Private bucket (PRIVATE_R2_*): sensitive documents (receipts, certificates, application docs)
 *
 * Required for sensitive uploads:
 *   PRIVATE_R2_ENDPOINT          — https://<account-id>.r2.cloudflarestorage.com
 *   PRIVATE_R2_ACCESS_KEY_ID     — R2 API token access key
 *   PRIVATE_R2_SECRET_ACCESS_KEY — R2 API token secret key
 *   PRIVATE_R2_BUCKET_NAME       — bucket name (e.g. tcoefs-portal-private)
 *
 * Optional for public assets:
 *   PUBLIC_R2_ENDPOINT, PUBLIC_R2_ACCESS_KEY_ID, PUBLIC_R2_SECRET_ACCESS_KEY, PUBLIC_R2_BUCKET_NAME, PUBLIC_R2_PUBLIC_URL
 */

const hasPublicR2Config = !!(
  process.env.PUBLIC_R2_ENDPOINT &&
  process.env.PUBLIC_R2_ACCESS_KEY_ID &&
  process.env.PUBLIC_R2_SECRET_ACCESS_KEY &&
  process.env.PUBLIC_R2_BUCKET_NAME
);

const hasPrivateR2Config = !!(
  process.env.PRIVATE_R2_ENDPOINT &&
  process.env.PRIVATE_R2_ACCESS_KEY_ID &&
  process.env.PRIVATE_R2_SECRET_ACCESS_KEY &&
  process.env.PRIVATE_R2_BUCKET_NAME
);

if (!hasPrivateR2Config && !hasPublicR2Config) {
  throw new Error(
    "No R2 configuration found. Set PRIVATE_R2_* env vars for sensitive uploads, or PUBLIC_R2_* for non-sensitive uploads."
  );
}

/**
 * Private R2 client for sensitive documents (payment receipts, certificates, application docs).
 * Sensitive documents are accessed via presigned GET URLs only.
 */
export const privateR2Client = hasPrivateR2Config
  ? new S3Client({
      region: "auto",
      endpoint: process.env.PRIVATE_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.PRIVATE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.PRIVATE_R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

/** The bucket for sensitive portal documents. */
export const PRIVATE_R2_BUCKET = process.env.PRIVATE_R2_BUCKET_NAME ?? null;

/**
 * Public R2 client for non-sensitive assets (thumbnails, images).
 * Non-sensitive assets can be served directly from public URL.
 */
export const r2Client = hasPublicR2Config
  ? new S3Client({
      region: "auto",
      endpoint: process.env.PUBLIC_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.PUBLIC_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.PUBLIC_R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

/** The bucket for public assets. */
export const R2_BUCKET = process.env.PUBLIC_R2_BUCKET_NAME ?? null;

/**
 * Public base URL for assets in the public folder of the bucket
 * (e.g. course thumbnails, institutional photos).
 */
export const R2_PUBLIC_BASE_URL = process.env.PUBLIC_R2_PUBLIC_URL ?? "";

/**
 * Key prefix structure for sensitive documents (use privateR2Client).
 *
 * Structure:
 *   documents/applications/{userId}/{applicationId}/{filename}
 *   documents/training/{userId}/{registrationId}/{filename}
 *   documents/payments/{userId}/{paymentId}/{filename}
 *   certificates/{userId}/{certificateId}.pdf
 *   courses/{courseId}/assets/{filename}
 */
export const PRIVATE_R2_PREFIXES = {
  applicationDocuments: (userId: string, applicationId: string) =>
    `documents/applications/${userId}/${applicationId}`,
  trainingDocuments: (userId: string, registrationId: string) =>
    `documents/training/${userId}/${registrationId}`,
  paymentReceipts: (userId: string, paymentId: string) =>
    `documents/payments/${userId}/${paymentId}`,
  certificates: (userId: string) => `certificates/${userId}`,
  courseAssets: (courseId: string) => `courses/${courseId}/assets`,
} as const;

/**
 * Key prefix structure for public assets (use r2Client).
 *
 * Structure:
 *   public/images/{filename}
 *   public/thumbnails/{filename}
 */
export const R2_PREFIXES = {
  publicImages: () => `public/images`,
  thumbnails: () => `public/thumbnails`,
} as const;