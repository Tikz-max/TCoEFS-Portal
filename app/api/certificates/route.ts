import { NextResponse } from "next/server";
import { listOwnCertificates } from "@/features/certificates";

export async function GET() {
  try {
    const certificates = await listOwnCertificates();
    return NextResponse.json({ success: true, data: certificates });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Could not fetch certificates.",
      },
      { status: 500 }
    );
  }
}
