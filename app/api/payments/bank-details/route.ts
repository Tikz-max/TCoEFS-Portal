import { NextResponse } from "next/server";
import { getBankTransferConfig } from "@/features/payments";

const DEFAULT_APPLICATION_FEE = 25000;

export async function GET() {
  try {
    const details = await getBankTransferConfig();

    return NextResponse.json({
      success: true,
      data: {
        ...details,
        amount: DEFAULT_APPLICATION_FEE,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Bank details API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to fetch bank details.",
      },
      { status: 500 }
    );
  }
}
