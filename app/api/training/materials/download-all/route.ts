import { NextResponse } from "next/server";
import { buildTrainingMaterialsZip } from "@/features/training/workspace";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const registrationId = url.searchParams.get("registration");
    const result = await buildTrainingMaterialsZip(registrationId);

    return new NextResponse(Buffer.from(result.content), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Training materials zip error:", error);
    return NextResponse.json(
      { success: false, error: "Could not generate materials zip." },
      { status: 500 }
    );
  }
}
