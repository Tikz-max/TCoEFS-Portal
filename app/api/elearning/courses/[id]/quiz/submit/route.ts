import { NextResponse } from "next/server";
import { z } from "zod";
import { submitQuiz } from "@/features/elearning";

const submitQuizSchema = z.object({
  quizId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answer: z.string().min(1).max(500),
      })
    )
    .min(1),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = submitQuizSchema.parse(await request.json());

    const result = await submitQuiz({
      courseId: id,
      quizId: body.quizId,
      answers: body.answers,
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
        { success: false, error: "Only enrolled participants can submit quizzes." },
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
        error: error instanceof Error ? error.message : "Could not submit quiz.",
      },
      { status: 500 }
    );
  }
}
