import { NextResponse } from "next/server";
import { getCourseQuizForParticipant } from "@/features/elearning";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const quiz = await getCourseQuizForParticipant(id);
    return NextResponse.json({ success: true, data: quiz });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Only enrolled participants can access this quiz." },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === "ACCESS_NOT_READY") {
      return NextResponse.json(
        {
          success: false,
          error: "Course access will be granted after your payment has been approved.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not fetch quiz.",
      },
      { status: 500 }
    );
  }
}
