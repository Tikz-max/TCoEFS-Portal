import { NextResponse } from "next/server";
import { confirmApplicationDocument } from "@/features/applications";
import type { DocumentType } from "@/types/database.types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      documentType?: DocumentType;
      filePath?: string;
    };

    const documentType = body.documentType;
    const filePath = (body.filePath || "").trim();

    if (!documentType || !filePath) {
      return NextResponse.json(
        { success: false, error: "documentType and filePath are required." },
        { status: 400 }
      );
    }

    const result = await confirmApplicationDocument({ documentType, filePath });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Confirm upload API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to confirm uploaded document.",
      },
      { status: 400 }
    );
  }
}
