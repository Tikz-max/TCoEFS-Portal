import { NextResponse } from "next/server";
import { z } from "zod";
import { moderateCourse } from "@/features/elearning";

const rejectSchema = z.object({
  reason: z.string().min(3).max(2000),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = rejectSchema.parse(await request.json());

    const result = await moderateCourse({
      courseId: id,
      action: "reject",
      reason: body.reason,
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
        { success: false, error: "Only super admin can reject e-learning courses." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not reject course.",
      },
      { status: 500 }
    );
  }
}
