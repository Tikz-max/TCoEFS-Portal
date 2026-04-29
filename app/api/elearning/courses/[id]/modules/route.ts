import { NextResponse } from "next/server";
import { z } from "zod";
import { createModule, getCourseById } from "@/features/elearning";

const createModuleSchema = z.object({
  title: z.string().min(3).max(200),
  contentType: z.enum(["video", "text", "document", "quiz"]),
  contentUrl: z.string().url().nullable().optional(),
  order: z.number().int().min(0),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const course = await getCourseById(id);
    return NextResponse.json({ success: true, data: course.modules || [] });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "You are not allowed to access these modules." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not fetch modules.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = createModuleSchema.parse(await request.json());
    const moduleRow = await createModule({
      courseId: id,
      title: body.title,
      contentType: body.contentType,
      contentUrl: body.contentUrl,
      order: body.order,
    });
    return NextResponse.json({ success: true, data: moduleRow });
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
        { success: false, error: "You are not allowed to create modules." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not create module.",
      },
      { status: 500 }
    );
  }
}
