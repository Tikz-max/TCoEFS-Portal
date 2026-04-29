import { NextResponse } from "next/server";
import { saveAdminTrainingSchedule, type TrainingScheduleDay } from "@/features/training/workspace";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const body = (await request.json()) as { schedule?: TrainingScheduleDay[] };
    await saveAdminTrainingSchedule(resolved.id, body.schedule || []);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Not allowed." },
        { status: 403 }
      );
    }

    console.error("Admin training schedule save error:", error);
    return NextResponse.json(
      { success: false, error: "Could not save training schedule." },
      { status: 500 }
    );
  }
}
