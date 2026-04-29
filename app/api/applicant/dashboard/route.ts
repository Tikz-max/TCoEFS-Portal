import { NextRequest, NextResponse } from "next/server";
import { getApplicantDashboardSnapshot } from "@/features/applications";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ensureDraft = searchParams.get("ensureDraft") === "1";
    const programmeSlug = searchParams.get("programme");

    const snapshot = await getApplicantDashboardSnapshot({
      ensureDraft,
      programmeSlug,
    });

    return NextResponse.json({ success: true, data: snapshot });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Applicant dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: "Could not load dashboard data." },
      { status: 500 }
    );
  }
}
