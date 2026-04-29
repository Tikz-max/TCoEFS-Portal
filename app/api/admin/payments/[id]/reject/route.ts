import { NextResponse } from "next/server";
import { rejectPayment } from "@/features/payments";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { reason?: string };

    const result = await rejectPayment({
      paymentId: id,
      reason: (body.reason || "").trim(),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "You are not allowed to reject payments." },
        { status: 403 }
      );
    }

    console.error("Reject payment API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to reject payment.",
      },
      { status: 500 }
    );
  }
}
