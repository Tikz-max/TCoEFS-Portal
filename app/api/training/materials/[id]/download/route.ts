import { NextResponse } from "next/server";
import { getTrainingMaterialDownloadUrl } from "@/features/training/workspace";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const url = new URL(request.url);
    const registrationId = url.searchParams.get("registration");
    const downloadUrl = await getTrainingMaterialDownloadUrl(resolved.id, registrationId);
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (error instanceof Error && (error.message === "FORBIDDEN" || error.message === "NOT_FOUND")) {
      return NextResponse.json(
        { success: false, error: "Material not available." },
        { status: 404 }
      );
    }

    console.error("Training material download error:", error);
    return NextResponse.json(
      { success: false, error: "Could not download training material." },
      { status: 500 }
    );
  }
}
