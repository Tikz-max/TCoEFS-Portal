import { NextResponse } from "next/server";
import { getLearnerDashboardSnapshot } from "@/features/elearning/experience";

export async function GET() {
  try {
    const data = await getLearnerDashboardSnapshot();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Only participants can view this dashboard." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not load learner dashboard.",
      },
      { status: 500 }
    );
  }
}
