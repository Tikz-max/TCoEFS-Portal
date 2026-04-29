import { NextResponse } from "next/server";
import { z } from "zod";
import { createQuiz, getCourseQuizzes } from "@/features/elearning";

const questionSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(1).max(2000),
  options: z.array(z.string().min(1).max(500)).min(2).max(10),
  correctAnswer: z.string().min(1).max(500),
});

const createQuizSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(3).max(200),
  passingScore: z.number().int().min(0).max(100),
  questions: z.array(questionSchema).min(1).max(200),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const quizzes = await getCourseQuizzes(id);
    return NextResponse.json({ success: true, data: quizzes });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "You are not allowed to access quizzes." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not fetch quizzes.",
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
    const body = createQuizSchema.parse(await request.json());
    const quiz = await createQuiz({
      courseId: id,
      moduleId: body.moduleId,
      title: body.title,
      questions: body.questions,
      passingScore: body.passingScore,
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
        { success: false, error: "You are not allowed to create quizzes." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not create quiz.",
      },
      { status: 500 }
    );
  }
}
