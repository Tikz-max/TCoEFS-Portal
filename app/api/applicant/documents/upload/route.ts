import { NextResponse } from "next/server";
import { uploadApplicationDocument } from "@/features/applications";
import type { DocumentType } from "@/types/database.types";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const documentType = String(formData.get("documentType") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "A document file is required." },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { success: false, error: "documentType is required." },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await uploadApplicationDocument({
      documentType: documentType as DocumentType,
      filename: file.name || "document",
      contentType: file.type || "application/octet-stream",
      contentLength: file.size,
      data: bytes,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Upload applicant document API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload application document.",
      },
      { status: 500 }
    );
  }
}
