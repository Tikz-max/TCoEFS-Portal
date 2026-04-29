import { NextResponse } from "next/server";
import { getPaymentStatus } from "@/features/payments";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      entityType?: "application" | "training_application" | "elearning_enrollment";
      entityId?: string;
    };

    const entityType = body.entityType;
    const entityId = (body.entityId || "").trim();

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: "entityType and entityId are required." },
        { status: 400 }
      );
    }

    const result = await getPaymentStatus(entityType, entityId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Payment status API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to fetch payment status.",
      },
      { status: 500 }
    );
  }
}
