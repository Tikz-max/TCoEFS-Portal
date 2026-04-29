import { NextResponse } from "next/server";
import { getAdminApplicationDetail } from "@/features/admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const detail = await getAdminApplicationDetail(id);
    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found.") {
      return NextResponse.json(
        { success: false, error: "Application not found." },
        { status: 404 }
      );
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Admin access required." },
        { status: 403 }
      );
    }
    console.error("Application detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load application." },
      { status: 500 }
    );
  }
}