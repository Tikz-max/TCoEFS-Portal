import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteCourse, getCourseById, updateCourse } from "@/features/elearning";

const updateCourseSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(3).max(5000).optional(),
    thumbnail: z.string().url().nullable().optional(),
    status: z.enum(["draft", "pending_publish", "published", "archived"]).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field is required.",
  });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const course = await getCourseById(id);
    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "You are not allowed to access this course." },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "Course not found.") {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not fetch course.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = updateCourseSchema.parse(await request.json());
    const updated = await updateCourse(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "You are not allowed to update this course." },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === "Course not found.") {
      return NextResponse.json(
        { success: false, error: "Course not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not update course.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = await deleteCourse(id);
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
        { success: false, error: "Only admin or super admin can delete a course." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not delete course.",
      },
      { status: 500 }
    );
  }
}
