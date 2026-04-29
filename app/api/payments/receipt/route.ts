import { NextResponse } from "next/server";
import { uploadPaymentReceipt, uploadPaymentReceiptFile } from "@/features/payments";
import { checkRateLimit, getRateLimitKey } from "@/lib/utils/rate-limit";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const rateLimitKey = getRateLimitKey(clientIp, "receipt-upload");
    const check = checkRateLimit(rateLimitKey, { windowMs: 3600000, maxRequests: 5 });

    if (!check.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many upload attempts. Please try again later.",
          retryAfter: Math.ceil((check.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((check.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    let result:
      | { success: true; receiptUploadedAt: string }
      | { success: true; receiptUploadedAt: string; filePath: string };

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const paymentId = String(formData.get("paymentId") || "").trim();
      const file = formData.get("file");

      if (!(file instanceof File) || !paymentId) {
        return NextResponse.json(
          { success: false, error: "paymentId and receipt file are required." },
          { status: 400 }
        );
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      result = await uploadPaymentReceiptFile({
        paymentId,
        filename: file.name || "receipt",
        contentType: file.type || "application/octet-stream",
        contentLength: file.size,
        data: bytes,
      });
    } else {
      const body = (await request.json()) as {
        paymentId?: string;
        filePath?: string;
      };

      const paymentId = (body.paymentId || "").trim();
      const filePath = (body.filePath || "").trim();

      if (!paymentId || !filePath) {
        return NextResponse.json(
          { success: false, error: "paymentId and filePath are required." },
          { status: 400 }
        );
      }

      result = await uploadPaymentReceipt({ paymentId, filePath });
    }

    return NextResponse.json({
      success: true,
      data: result,
      rateLimit: { remaining: check.remaining },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "You cannot upload a receipt for this payment." },
        { status: 403 }
      );
    }

    console.error("Upload payment receipt API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to upload payment receipt.",
      },
      { status: 500 }
    );
  }
}
