import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteQuiz, getQuizByIdForCourse, updateQuiz } from "@/features/elearning";

const questionSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(1).max(2000),
  options: z.array(z.string().min(1).max(500)).min(2).max(10),
  correctAnswer: z.string().min(1).max(500),
});

const updateQuizSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    passingScore: z.number().int().min(0).max(100).optional(),
    questions: z.array(questionSchema).min(1).max(200).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field is required.",
  });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const { id, quizId } = await context.params;
    const quiz = await getQuizByIdForCourse({ courseId: id, quizId });
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
        { success: false, error: "You are not allowed to access this quiz." },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === "Quiz not found.") {
      return NextResponse.json(
        { success: false, error: "Quiz not found." },
        { status: 404 }
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const { id, quizId } = await context.params;
    const body = updateQuizSchema.parse(await request.json());

    const quiz = await updateQuiz({
      courseId: id,
      quizId,
      title: body.title,
      passingScore: body.passingScore,
      questions: body.questions,
    });
    return NextResponse.json({ success: true, data: quiz });
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
        { success: false, error: "You are not allowed to update this quiz." },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === "Quiz not found.") {
      return NextResponse.json(
        { success: false, error: "Quiz not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not update quiz.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const { id, quizId } = await context.params;
    const result = await deleteQuiz({ courseId: id, quizId });
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
        { success: false, error: "You are not allowed to delete this quiz." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not delete quiz.",
      },
      { status: 500 }
    );
  }
}
