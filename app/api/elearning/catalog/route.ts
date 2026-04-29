import { NextResponse } from "next/server";
import { getCourseCatalogSnapshot } from "@/features/elearning/experience";

export async function GET() {
  try {
    const data = await getCourseCatalogSnapshot();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not load course catalog.",
      },
      { status: 500 }
    );
  }
}
