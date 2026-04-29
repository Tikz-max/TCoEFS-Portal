import { NextResponse } from "next/server";
import { z } from "zod";
import { createCourse, listCourses } from "@/features/elearning";

const createCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(3).max(5000),
  thumbnail: z.string().url().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeRaw = (searchParams.get("scope") || "published").trim();

    const scope =
      scopeRaw === "enrolled" ||
      scopeRaw === "admin" ||
      scopeRaw === "all" ||
      scopeRaw === "published"
        ? scopeRaw
        : "published";

    const courses = await listCourses({
      scope: scope as "published" | "enrolled" | "admin" | "all",
    });

    return NextResponse.json({ success: true, data: courses });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "You are not allowed to view these courses." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not fetch courses.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = createCourseSchema.parse(await request.json());
    const result = await createCourse(body);
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
        { success: false, error: "You are not allowed to create courses." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not create course.",
      },
      { status: 500 }
    );
  }
}
