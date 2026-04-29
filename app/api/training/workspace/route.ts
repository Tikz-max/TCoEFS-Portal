import { NextResponse } from "next/server";
import { getTrainingWorkspaceSnapshot } from "@/features/training/workspace";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const registrationId = url.searchParams.get("registration");
    const materialType = url.searchParams.get("type");
    const data = await getTrainingWorkspaceSnapshot({ registrationId, materialType });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Training workspace API error:", error);
    return NextResponse.json(
      { success: false, error: "Could not load training workspace." },
      { status: 500 }
    );
  }
}
