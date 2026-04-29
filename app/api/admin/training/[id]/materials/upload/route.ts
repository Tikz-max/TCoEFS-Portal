import { NextResponse } from "next/server";
import { uploadAdminTrainingMaterialFile } from "@/features/training/workspace";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const phase = String(formData.get("phase") || "pre_training").trim() as
      | "pre_training"
      | "session"
      | "post_training";
    const sessionLabel = String(formData.get("sessionLabel") || "").trim();
    const materialType = String(formData.get("materialType") || "Document").trim();
    const sortOrder = Number(formData.get("sortOrder") || 0);

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "A material file is required." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Material title is required." },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const data = await uploadAdminTrainingMaterialFile({
      trainingId: resolved.id,
      title,
      description,
      phase,
      sessionLabel,
      materialType,
      sortOrder,
      filename: file.name || "material",
      contentType: file.type || "application/octet-stream",
      contentLength: file.size,
      data: bytes,
    });

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
        { success: false, error: "Not allowed." },
        { status: 403 }
      );
    }

    console.error("Admin training material upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not upload training material.",
      },
      { status: 500 }
    );
  }
}
