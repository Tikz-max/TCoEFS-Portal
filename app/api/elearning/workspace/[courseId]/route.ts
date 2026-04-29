import { NextResponse } from "next/server";
import { getLearnerCourseWorkspace } from "@/features/elearning/experience";

export async function GET(
  request: Request,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");
    const data = await getLearnerCourseWorkspace(courseId, moduleId);
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
        { success: false, error: "Only participants can access this learning workspace." },
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

    if (
      error instanceof Error &&
      (error.message === "Course not found." || error.message === "Module not found.")
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not load learning workspace.",
      },
      { status: 500 }
    );
  }
}
