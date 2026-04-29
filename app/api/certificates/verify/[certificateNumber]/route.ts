import { NextResponse } from "next/server";
import { verifyCertificate } from "@/features/certificates";

export async function GET(
  _request: Request,
  context: { params: Promise<{ certificateNumber: string }> }
) {
  try {
    const { certificateNumber } = await context.params;
    const result = await verifyCertificate(certificateNumber);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Could not verify certificate.",
      },
      { status: 500 }
    );
  }
}
