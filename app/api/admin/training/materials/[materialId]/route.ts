import { NextResponse } from "next/server";
import { deleteAdminTrainingMaterial } from "@/features/training/workspace";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const resolved = await params;
    await deleteAdminTrainingMaterial(resolved.materialId);
    return NextResponse.json({ success: true });
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
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Material not found." },
        { status: 404 }
      );
    }

    console.error("Admin training material delete error:", error);
    return NextResponse.json(
      { success: false, error: "Could not delete training material." },
      { status: 500 }
    );
  }
}
