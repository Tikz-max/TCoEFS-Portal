import { NextResponse } from "next/server";
import { getAdminApplicationDocumentUrl } from "@/features/admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id, documentId } = await context.params;
    const documentUrl = await getAdminApplicationDocumentUrl(id, documentId);
    return NextResponse.json({ success: true, data: { documentUrl } });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found.") {
      return NextResponse.json(
        { success: false, error: "Application not found." },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === "Document not found.") {
      return NextResponse.json(
        { success: false, error: "Document not found." },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Admin access required." },
        { status: 403 }
      );
    }

    console.error("Admin application document URL error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load document." },
      { status: 500 }
    );
  }
}
