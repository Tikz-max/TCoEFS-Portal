import { NextResponse } from "next/server";
import { createManualPayment } from "@/features/payments";
import { checkRateLimit, getRateLimitKey } from "@/lib/utils/rate-limit";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      entityType?: "application" | "training_application" | "elearning_enrollment";
      entityId?: string;
      amount?: number;
    };

    const entityType = body.entityType || "application";
    const amount = Number(body.amount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid payment amount is required." },
        { status: 400 }
      );
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    const rateLimitKey = getRateLimitKey(clientIp, "payment-create");
    const check = checkRateLimit(rateLimitKey, { windowMs: 3600000, maxRequests: 10 });

    if (!check.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many payment requests. Please try again later.",
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

    const result = await createManualPayment({
      entityType,
      entityId: body.entityId,
      amount,
    });

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

    console.error("Create manual payment API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to create payment.",
      },
      { status: 500 }
    );
  }
}
