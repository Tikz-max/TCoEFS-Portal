import crypto from "crypto";
import { env } from "@/lib/utils/env";

/**
 * Remita Payment Gateway integration.
 *
 * Remita is Nigeria's most widely used institutional payment gateway,
 * used by government MDAs, universities, and large organisations.
 * TCoEFS uses it for all application and training registration fees.
 *
 * How the payment flow works on this portal:
 *
 *   1. User completes their application/registration form
 *   2. Server calls generateRRR() → gets back a Remita Retrieval Reference (RRR)
 *   3. RRR + bank details are displayed to the user on the payment reference card
 *   4. User walks to their bank (or uses internet banking) and pays using the RRR
 *   5. Remita notifies the portal via webhook (handleWebhookPayload in webhook.ts)
 *      OR admin manually triggers verifyPaymentByRRR() from the verification panel
 *   6. Payment status is updated in Supabase, user is notified via email
 *
 * Required environment variables:
 *   REMITA_MERCHANT_ID      — your merchant ID on Remita
 *   REMITA_SERVICE_TYPE_ID  — service type ID for the specific fee category
 *   REMITA_API_KEY          — API key for hash generation
 *   REMITA_SECRET_KEY       — secret key for webhook signature verification
 *   REMITA_PUBLIC_KEY       — base64-encoded public key
 *   REMITA_BASE_URL         — https://login.remita.net/remita/exapp/api/v1/send/api  (prod)
 *                             https://demo.remita.net/remita/exapp/api/v1/send/api   (demo)
 *
 * References:
 *   Official SDK: https://github.com/RemitaNet/billing-gateway-sdk-nodejs
 *   NestJS implementation reference: https://medium.com/@franksagie1/...
 */

// ─── Environment ──────────────────────────────────────────────────────────────

const MERCHANT_ID = env("REMITA_MERCHANT_ID");
const SERVICE_TYPE_ID = env("REMITA_SERVICE_TYPE_ID");
const API_KEY = env("REMITA_API_KEY");
const SECRET_KEY = env("REMITA_SECRET_KEY");
const BASE_URL = env("REMITA_BASE_URL");

// ─── Types ────────────────────────────────────────────────────────────────────

/** The two fee modules that generate RRRs on this portal. */
export type PaymentModule = "postgraduate_application" | "training_registration";

export interface GenerateRRRParams {
  /** Internal order/transaction ID — must be unique per payment attempt. */
  orderId: string;
  /** Amount in Naira (numeric string, e.g. "25000"). */
  amount: string;
  /** Full name of the payer. */
  payerName: string;
  /** Email address of the payer — Remita sends a receipt here. */
  payerEmail: string;
  /** Phone number of the payer (e.g. "08012345678"). */
  payerPhone: string;
  /** Descriptive label shown on the Remita receipt. */
  description: string;
}

export interface GenerateRRRResult {
  /** The Remita Retrieval Reference number. This is the key the payer quotes at the bank. */
  rrr: string;
  /** The raw status code returned by Remita (025 = success). */
  statuscode: string;
  /** Human-readable status message from Remita. */
  status: string;
  /** The order ID that was submitted — echo back for confirmation. */
  orderId: string;
}

export interface PaymentStatusResult {
  /** The RRR that was checked. */
  rrr: string;
  /** Remita status code. 00 or 01 = paid. 021 = not yet paid. */
  status: string;
  /** Human-readable description of the payment status. */
  message: string;
  /** Amount paid (may differ from amount owed in partial payment scenarios). */
  amount: string;
  /** ISO date string of when the payment was made, if applicable. */
  paymentDate: string | null;
  /** Bank channel used (e.g. "Internet Banking", "Bank Branch"). */
  channel: string | null;
  /** Whether the payment is confirmed as complete. */
  isPaid: boolean;
}

export interface RemitaWebhookPayload {
  /** The RRR being reported on. */
  rrr: string;
  /** Order reference from the merchant system. */
  orderRef: string;
  /** Remita transaction reference. */
  transactionId: string;
  /** Amount paid. */
  amount: string;
  /** Payment date. */
  paymentDate: string;
  /** Debited account number (masked). */
  debitedAccount: string;
  /** Bank that processed the payment. */
  paymentChannel: string;
  /** Remita status code. */
  status: string;
  /** Remita-generated hash for verifying the webhook is genuine. */
  hash: string;
}

// ─── Hash Helpers ─────────────────────────────────────────────────────────────

/**
 * Generates the SHA-512 authorisation hash for RRR generation requests.
 *
 * Formula (from Remita docs):
 *   SHA512( merchantId + serviceTypeId + orderId + amount + apiKey )
 *
 * This hash authenticates the request to Remita's servers.
 * It is computed server-side so that the API key is never exposed to the browser.
 */
function generateRRRHash(
  orderId: string,
  amount: string
): string {
  const input = `${MERCHANT_ID}${SERVICE_TYPE_ID}${orderId}${amount}${API_KEY}`;
  return crypto.createHash("sha512").update(input).digest("hex");
}

/**
 * Generates the SHA-512 hash for payment status check requests.
 *
 * Formula (from Remita docs):
 *   SHA512( merchantId + rrr + apiKey )
 */
function generateStatusHash(rrr: string): string {
  const input = `${MERCHANT_ID}${rrr}${API_KEY}`;
  return crypto.createHash("sha512").update(input).digest("hex");
}

/**
 * Verifies the hash on an incoming Remita webhook payload.
 *
 * Remita signs its webhook notifications with:
 *   SHA512( rrr + amount + merchantId + secretKey )
 *
 * We recompute this hash and compare it against the hash in the payload.
 * If they don't match, the webhook is not from Remita and must be rejected.
 *
 * @returns true if the hash is valid, false if it has been tampered with
 */
export function verifyWebhookSignature(payload: RemitaWebhookPayload): boolean {
  const expected = crypto
    .createHash("sha512")
    .update(`${payload.rrr}${payload.amount}${MERCHANT_ID}${SECRET_KEY}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(payload.hash, "hex")
  );
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

/**
 * Parses the JSONP-wrapped response that Remita's payment init endpoint returns.
 *
 * Remita wraps its JSON response in a JSONP callback:
 *   jsonp({ "statuscode": "025", "RRR": "..." })
 *
 * We strip the wrapper before parsing.
 */
function parseRemitaResponse(raw: string): Record<string, string> {
  const stripped = raw
    .trim()
    .replace(/^jsonp\s*\(/, "")
    .replace(/\)\s*;?\s*$/, "");
  return JSON.parse(stripped);
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Generates a Remita Retrieval Reference (RRR) for a payment.
 *
 * The RRR is the unique identifier that links a bank payment to a portal
 * registration or application. It must be displayed prominently to the user
 * and stored in Supabase alongside the pending payment record.
 *
 * The RRR is generated BEFORE the payment is made — the user takes it to
 * their bank (or uses internet banking) and quotes it when paying.
 *
 * Call this from:
 *   - POST /api/payments/generate-rrr
 *   - The relevant Server Action in src/features/payments/actions/
 *
 * @throws {RemitaError} if Remita returns a non-success status
 * @throws {Error} if the network request fails
 */
export async function generateRRR(
  params: GenerateRRRParams
): Promise<GenerateRRRResult> {
  const { orderId, amount, payerName, payerEmail, payerPhone, description } =
    params;

  const hash = generateRRRHash(orderId, amount);

  const url = `${BASE_URL}/echannelsvc/merchant/api/paymentinit`;

  const payload = {
    serviceTypeId: SERVICE_TYPE_ID,
    orderId,
    amount,
    payerName,
    payerEmail,
    payerPhone,
    description,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `remitaConsumerKey=${MERCHANT_ID},remitaConsumerToken=${hash}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new RemitaError(
      `Remita RRR generation failed with HTTP ${response.status}`,
      response.status
    );
  }

  const raw = await response.text();
  const parsed = parseRemitaResponse(raw);

  /**
   * Remita returns statuscode "025" for a successful RRR generation.
   * Any other code indicates an error.
   */
  if (parsed.statuscode !== "025") {
    throw new RemitaError(
      parsed.status ?? `RRR generation failed (statuscode: ${parsed.statuscode})`,
      undefined,
      parsed.statuscode
    );
  }

  return {
    rrr: parsed.RRR,
    statuscode: parsed.statuscode,
    status: parsed.status ?? "Successful",
    orderId,
  };
}

/**
 * Checks the payment status of a given RRR.
 *
 * Used by:
 * - The admin payment verification panel (manual re-check)
 * - A scheduled job (if implemented) to auto-verify stale pending payments
 *
 * Remita status codes:
 *   00 or 01 — Payment successful
 *   021      — Payment not yet made / not found
 *   others   — Various error states
 *
 * @throws {RemitaError} if Remita returns an unexpected response
 * @throws {Error} if the network request fails
 */
export async function verifyPaymentByRRR(
  rrr: string
): Promise<PaymentStatusResult> {
  const hash = generateStatusHash(rrr);

  const url = `${BASE_URL}/echannelsvc/${MERCHANT_ID}/${rrr}/${hash}/orderstatus.reg`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `remitaConsumerKey=${MERCHANT_ID},remitaConsumerToken=${hash}`,
    },
  });

  if (!response.ok) {
    throw new RemitaError(
      `Remita status check failed with HTTP ${response.status}`,
      response.status
    );
  }

  const parsed: Record<string, string> = await response.json();

  const isPaid = parsed.status === "00" || parsed.status === "01";

  return {
    rrr,
    status: parsed.status,
    message: parsed.message ?? parsed.status,
    amount: parsed.amount ?? "0",
    paymentDate: parsed.paymentDate ?? null,
    channel: parsed.channel ?? null,
    isPaid,
  };
}

/**
 * Generates a unique, collision-resistant order ID for a payment.
 *
 * The order ID is the merchant-side reference for the transaction.
 * It must be unique per payment attempt — reusing an order ID will cause
 * Remita to return the existing RRR rather than generating a new one.
 *
 * Format: TCOEFS-{MODULE_PREFIX}-{userId_first8}-{timestamp}-{random4}
 *
 * Examples:
 *   TCOEFS-APP-a1b2c3d4-1741123456789-9f3c
 *   TCOEFS-TRN-e5f6g7h8-1741123456789-2a8b
 */
export function generateOrderId(
  module: PaymentModule,
  userId: string
): string {
  const prefix = module === "postgraduate_application" ? "APP" : "TRN";
  const userSegment = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const timestamp = Date.now();
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `TCOEFS-${prefix}-${userSegment}-${timestamp}-${random}`;
}

// ─── Error Class ──────────────────────────────────────────────────────────────

/**
 * Typed error class for Remita-specific failures.
 *
 * Allows callers to distinguish between:
 * - Network failures (plain Error)
 * - Remita business-logic failures (RemitaError with statusCode)
 *
 * Usage in Route Handlers:
 *   catch (error) {
 *     if (error instanceof RemitaError) {
 *       return Response.json({ error: error.message }, { status: 422 });
 *     }
 *     throw error; // let Next.js handle unexpected errors
 *   }
 */
export class RemitaError extends Error {
  /** HTTP status code from Remita's server, if applicable. */
  public readonly httpStatus?: number;
  /** Remita's own status code (e.g. "025", "021"). */
  public readonly remitaStatusCode?: string;

  constructor(
    message: string,
    httpStatus?: number,
    remitaStatusCode?: string
  ) {
    super(message);
    this.name = "RemitaError";
    this.httpStatus = httpStatus;
    this.remitaStatusCode = remitaStatusCode;
  }
}
