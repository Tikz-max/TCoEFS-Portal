import { NextResponse } from "next/server";
import { getPublicCourseDetailBySlug } from "@/features/elearning/experience";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const data = await getPublicCourseDetailBySlug(slug);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "Course not found.") {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not load course detail.",
      },
      { status: 500 }
    );
  }
}
