import { NextResponse } from "next/server";
import { z } from "zod";
import { updateProgress } from "@/features/elearning";

const progressSchema = z.object({
  moduleId: z.string().uuid(),
  completed: z.boolean(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = progressSchema.parse(await request.json());

    const result = await updateProgress({
      courseId: id,
      moduleId: body.moduleId,
      completed: body.completed,
    });

    return NextResponse.json({ success: true, data: result });
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
        { success: false, error: "Only enrolled participants can update progress." },
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
        error: error instanceof Error ? error.message : "Could not update progress.",
      },
      { status: 500 }
    );
  }
}
