import { NextResponse } from "next/server";
import {
  confirmTrainingRegistration,
  rejectTrainingRegistration,
} from "@/features/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, registrationId, reason } = body;

    if (action === "confirm") {
      await confirmTrainingRegistration(registrationId);
      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "Rejection reason is required." },
          { status: 400 }
        );
      }
      await rejectTrainingRegistration(registrationId, reason);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Admin access required." },
        { status: 403 }
      );
    }
    console.error("Training registration action error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process registration." },
      { status: 500 }
    );
  }
}