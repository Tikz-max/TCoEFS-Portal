import { NextResponse } from "next/server";
import { z } from "zod";
import { generateCertificateAsSuperAdmin } from "@/features/certificates";

const generateCertificateSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = generateCertificateSchema.parse(await request.json());
    const result = await generateCertificateAsSuperAdmin({
      userId: body.userId,
      courseId: body.courseId,
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
        {
          success: false,
          error: "Only super admin can manually trigger certificate generation.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Could not generate certificate.",
      },
      { status: 500 }
    );
  }
}
