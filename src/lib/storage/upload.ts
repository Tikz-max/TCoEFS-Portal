import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  privateR2Client,
  PRIVATE_R2_BUCKET,
  PRIVATE_R2_PREFIXES,
  r2Client,
  R2_BUCKET,
  R2_PREFIXES,
} from "./r2";

/**
 * Presigned URL helpers for Cloudflare R2.
 *
 * Two buckets are configured:
 * - Private bucket (PRIVATE_R2_*): sensitive documents (receipts, certificates, application docs)
 * - Public bucket (R2_*): non-sensitive assets (thumbnails, images)
 *
 * The upload flow for all documents is:
 *   1. Client calls  POST /api/uploads/presign  →  server generates a presigned PUT URL
 *   2. Client uploads the file directly to R2 using the presigned URL (credentials never exposed)
 *   3. Client calls  POST /api/uploads/confirm  →  server records the key in Supabase
 *
 * For reading sensitive documents (transcripts, IDs, receipts):
 *   1. Server generates a short-lived presigned GET URL on demand
 *   2. URL is returned to the authenticated, authorised user only
 *   3. URL expires — the file itself is never publicly accessible
 *
 * Allowed file types and size limits are enforced here and re-validated in the
 * Route Handler before the presigned URL is issued.
 */

// ─── Constants ──────────────────────────────────────────────────────────────

/** Presigned PUT URL expiry — 10 minutes. Long enough for slow connections. */
const PUT_URL_EXPIRES_IN = 60 * 10;

/** Presigned GET URL expiry — 5 minutes. Short to limit exposure of sensitive docs. */
const GET_URL_EXPIRES_IN = 60 * 5;

/** Maximum upload size per file: 10 MB */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed MIME types for document uploads */
export const ALLOWED_DOCUMENT_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

/** Allowed MIME types for payment receipt uploads */
export const ALLOWED_RECEIPT_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

// ─── Types ───────────────────────────────────────────────────────────────────-

export type DocumentCategory =
  | "applicationDocument"
  | "trainingDocument"
  | "paymentReceipt"
  | "certificate"
  | "courseAsset"
  | "publicImage";

export interface PresignedUploadOptions {
  /** The S3/R2 object key (full path in the bucket) */
  key: string;
  /** MIME type of the file being uploaded */
  contentType: string;
  /** File size in bytes — used to set Content-Length on the PUT */
  contentLength: number;
}

export interface PresignedUploadResult {
  /** The presigned URL the client must PUT to */
  uploadUrl: string;
  /** The final object key stored in R2 — save this to Supabase after upload */
  key: string;
}

export interface PresignedReadOptions {
  /** The S3/R2 object key to generate a read URL for */
  key: string;
  /** Optional: override the default expiry in seconds */
  expiresIn?: number;
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Validates that an uploaded file meets the type and size requirements.
 * Call this in the Route Handler before generating the presigned URL.
 *
 * @throws {Error} with a descriptive message if validation fails
 */
export function validateUpload(
  contentType: string,
  contentLength: number,
  allowedTypes: Record<string, string[]> = ALLOWED_DOCUMENT_TYPES
): void {
  if (!Object.keys(allowedTypes).includes(contentType)) {
    const allowed = Object.values(allowedTypes).flat().join(", ");
    throw new Error(
      `File type "${contentType}" is not allowed. Accepted formats: ${allowed}.`
    );
  }

  if (contentLength > MAX_FILE_SIZE_BYTES) {
    const maxMb = MAX_FILE_SIZE_BYTES / (1024 * 1024);
    throw new Error(
      `File size exceeds the ${maxMb}MB limit. Please compress the file and try again.`
    );
  }

  if (contentLength <= 0) {
    throw new Error("File appears to be empty. Please select a valid file.");
  }
}

// ─── Key Builders ─────────────────────────────────────────────────────────────

/**
 * Determines which R2 client and bucket to use based on the document category.
 */
function getR2ForCategory(
  category: DocumentCategory
): {
  client: typeof privateR2Client;
  bucket: string | null;
} {
  const isSensitive =
    category === "applicationDocument" ||
    category === "trainingDocument" ||
    category === "paymentReceipt" ||
    category === "certificate" ||
    category === "courseAsset";

  if (isSensitive) {
    if (!privateR2Client || !PRIVATE_R2_BUCKET) {
      throw new Error("Private R2 is not configured.");
    }
    return {
      client: privateR2Client,
      bucket: PRIVATE_R2_BUCKET,
    };
  }

  if (!r2Client || !R2_BUCKET) {
    throw new Error("Public R2 is not configured.");
  }
  return {
    client: r2Client,
    bucket: R2_BUCKET,
  };
}

/**
 * Builds the R2 object key for a given document upload.
 * Keys are namespaced so that:
 *  - Per-user documents are isolated
 *  - Lifecycle rules can be scoped per category
 *  - Debugging is straightforward
 *
 * The filename is sanitised — only alphanumerics, dots, hyphens, and underscores
 * are kept to prevent path traversal and encoding issues.
 */
export function buildDocumentKey(
  category: DocumentCategory,
  userId: string,
  contextId: string,
  originalFilename: string
): string {
  const sanitisedFilename = originalFilename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");

  const timestamp = Date.now();
  const filename = `${timestamp}-${sanitisedFilename}`;

  switch (category) {
    case "applicationDocument":
      return `${PRIVATE_R2_PREFIXES.applicationDocuments(userId, contextId)}/${filename}`;
    case "trainingDocument":
      return `${PRIVATE_R2_PREFIXES.trainingDocuments(userId, contextId)}/${filename}`;
    case "paymentReceipt":
      return `${PRIVATE_R2_PREFIXES.paymentReceipts(userId, contextId)}/${filename}`;
    case "certificate":
      return `${PRIVATE_R2_PREFIXES.certificates(userId)}/${contextId}.pdf`;
    case "courseAsset":
      return `${PRIVATE_R2_PREFIXES.courseAssets(contextId)}/${filename}`;
    case "publicImage":
      return `${R2_PREFIXES.publicImages()}/${filename}`;
    default:
      throw new Error(`Unknown document category: ${category}`);
  }
}

/**
 * Builds the R2 object key for a generated certificate PDF.
 * Certificates are named by userId + certificateId so they can be re-fetched
 * deterministically without storing the key in multiple places.
 */
export function buildCertificateKey(
  userId: string,
  certificateId: string
): string {
  return `${PRIVATE_R2_PREFIXES.certificates(userId)}/${certificateId}.pdf`;
}

// ─── Presigned URL Generators ─────────────────────────────────────────────────

/**
 * Generates a presigned PUT URL for uploading a file directly to R2.
 *
 * The URL expires in 10 minutes. The client must use it within that window.
 * The Content-Type header sent by the client during the PUT MUST match the
 * contentType used to generate this URL, or R2 will reject the request.
 *
 * Server-side only — never call this from a Client Component.
 */
export async function generatePresignedUploadUrl(
  options: PresignedUploadOptions
): Promise<PresignedUploadResult> {
  const { key, contentType, contentLength } = options;

  // Determine bucket from the key prefix
  const isPrivate =
    key.startsWith("documents/") ||
    key.startsWith("certificates/") ||
    key.startsWith("courses/");

  const client = isPrivate ? privateR2Client : r2Client;
  const bucket = isPrivate ? PRIVATE_R2_BUCKET : R2_BUCKET;

  if (!client || !bucket) {
    throw new Error(
      isPrivate ? "Private R2 is not configured." : "Public R2 is not configured."
    );
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
    /**
     * Metadata stored alongside the object in R2.
     * Useful for auditing without querying the database.
     */
    Metadata: {
      uploadedAt: new Date().toISOString(),
    },
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: PUT_URL_EXPIRES_IN,
  });

  return { uploadUrl, key };
}

/**
 * Generates a presigned GET URL for reading a private document from R2.
 *
 * Use this when an authenticated, authorised user needs to view or download
 * a document (e.g. an admin reviewing an applicant's transcript).
 *
 * The URL expires in 5 minutes by default. Extend only if needed for downloads
 * on slow connections.
 *
 * Server-side only.
 */
export async function generatePresignedReadUrl(
  options: PresignedReadOptions
): Promise<string> {
  const { key, expiresIn = GET_URL_EXPIRES_IN } = options;

  // Determine bucket from the key prefix
  const isPrivate =
    key.startsWith("documents/") ||
    key.startsWith("certificates/") ||
    key.startsWith("courses/");

  const client = isPrivate ? privateR2Client : r2Client;
  const bucket = isPrivate ? PRIVATE_R2_BUCKET : R2_BUCKET;

  if (!client || !bucket) {
    throw new Error(
      isPrivate ? "Private R2 is not configured." : "Public R2 is not configured."
    );
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Deletes an object from R2 by key.
 *
 * Used when:
 *  - An applicant replaces a previously uploaded document
 *  - An application is permanently deleted (GDPR / data retention)
 *  - A certificate is regenerated and the old version must be removed
 *
 * Server-side only. Requires the admin R2 credentials.
 */
export async function deleteObject(key: string): Promise<void> {
  const isPrivate =
    key.startsWith("documents/") ||
    key.startsWith("certificates/") ||
    key.startsWith("courses/");

  const client = isPrivate ? privateR2Client : r2Client;
  const bucket = isPrivate ? PRIVATE_R2_BUCKET : R2_BUCKET;

  if (!client || !bucket) {
    throw new Error(
      isPrivate ? "Private R2 is not configured." : "Public R2 is not configured."
    );
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}