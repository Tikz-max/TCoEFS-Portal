import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteModule, getCourseModule, updateModule } from "@/features/elearning";

const updateModuleSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    contentType: z.enum(["video", "text", "document", "quiz"]).optional(),
    contentUrl: z.string().url().nullable().optional(),
    order: z.number().int().min(0).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field is required.",
  });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await context.params;
    const data = await getCourseModule({ courseId: id, moduleId });
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
        { success: false, error: "You are not allowed to access this module." },
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

    if (error instanceof Error && error.message === "Module not found.") {
      return NextResponse.json(
        { success: false, error: "Module not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not fetch module.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await context.params;
    const body = updateModuleSchema.parse(await request.json());

    const updated = await updateModule({
      courseId: id,
      moduleId,
      title: body.title,
      contentType: body.contentType,
      contentUrl: body.contentUrl,
      order: body.order,
    });

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
        { success: false, error: "You are not allowed to update this module." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not update module.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const { id, moduleId } = await context.params;
    const result = await deleteModule({ courseId: id, moduleId });
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
        { success: false, error: "You are not allowed to delete this module." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not delete module.",
      },
      { status: 500 }
    );
  }
}
