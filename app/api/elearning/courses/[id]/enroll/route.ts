import { NextResponse } from "next/server";
import { enrollInCourse } from "@/features/elearning";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = await enrollInCourse(id);
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
        { success: false, error: "Only participants can enroll in a course." },
        { status: 403 }
      );
    }

    if (
      error instanceof Error &&
      (error.message === "Course not found." ||
        error.message === "Only published courses can be enrolled." ||
        error.message === "Already enrolled in this course.")
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not enroll in course.",
      },
      { status: 500 }
    );
  }
}
