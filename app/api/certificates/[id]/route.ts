import { NextResponse } from "next/server";
import { getCertificateByIdForCurrentUser } from "@/features/certificates";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const certificate = await getCertificateByIdForCurrentUser(id);
    return NextResponse.json({ success: true, data: certificate });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "You are not allowed to access this certificate." },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === "Certificate not found.") {
      return NextResponse.json(
        { success: false, error: "Certificate not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not fetch certificate.",
      },
      { status: 500 }
    );
  }
}
