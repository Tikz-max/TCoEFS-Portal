import { NextResponse } from "next/server";
import { getTrainingDashboardSnapshot } from "@/features/training";

export async function GET() {
  try {
    const data = await getTrainingDashboardSnapshot();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Training dashboard API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load training dashboard.",
      },
      { status: 500 }
    );
  }
}
