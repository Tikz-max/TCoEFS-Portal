import { NextResponse } from "next/server";
import {
  confirmTrainingDocuments,
  getTrainingRegistrationPayload,
  saveTrainingParticipantProfile,
  setTrainingProgramme,
} from "@/features/training";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const programmeSlug = url.searchParams.get("programme");
    const applicationId = url.searchParams.get("registration");
    const data = await getTrainingRegistrationPayload({ programmeSlug, applicationId });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Training application GET error:", error);
    return NextResponse.json(
      { success: false, error: "Could not load training flow." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "select_programme" | "save_profile" | "confirm_documents";
      programmeSlug?: string;
      applicationId?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };

    if (body.action === "select_programme") {
      const result = await setTrainingProgramme(body.programmeSlug || "");
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed.", issues: result.issues },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, data: result });
    }

    if (body.action === "save_profile") {
      const result = await saveTrainingParticipantProfile({
        firstName: body.firstName || "",
        lastName: body.lastName || "",
        phone: body.phone || "",
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed.", issues: result.issues },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === "confirm_documents") {
      const result = await confirmTrainingDocuments(body.applicationId || null);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed.", issues: result.issues },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action." },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Training application POST error:", error);
    return NextResponse.json(
      { success: false, error: "Could not save training step." },
      { status: 500 }
    );
  }
}
