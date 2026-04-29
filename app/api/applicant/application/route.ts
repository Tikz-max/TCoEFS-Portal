import { NextResponse } from "next/server";
import {
  confirmApplicationDocument,
  getApplicationDocumentChecklist,
  getApplicantDashboardSnapshot,
  getProgrammeOptions,
  markApplicationReadyForReview,
  REQUIRED_DOCUMENTS,
  saveApplicantPersonalDetails,
  setApplicationProgramme,
} from "@/features/applications";
import type { DocumentType } from "@/types/database.types";

export async function GET() {
  try {
    const [snapshot, programmes] = await Promise.all([
      getApplicantDashboardSnapshot({ ensureDraft: true }),
      getProgrammeOptions(),
    ]);

    const missingLabels = new Set(snapshot.missingDocuments);
    const items = REQUIRED_DOCUMENTS.map((item) => ({
      type: item.type,
      label: item.label,
      uploaded: !missingLabels.has(item.label),
      filePath: null,
    }));

    const checklist = {
      applicationId: snapshot.applicationId,
      items,
      uploadedCount: snapshot.uploadedDocuments,
      requiredCount: snapshot.requiredDocuments,
      complete: snapshot.uploadedDocuments >= snapshot.requiredDocuments,
    };

    return NextResponse.json({
      success: true,
      data: {
        snapshot,
        programmes,
        checklist,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("Applicant application GET error:", error);
    return NextResponse.json(
      { success: false, error: "Could not load application flow." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "select_programme" | "save_personal";
      programmeSlug?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      personalStatement?: string;
      documentType?: string;
      filePath?: string;
    };

    if (body.action === "select_programme") {
      const result = await setApplicationProgramme(body.programmeSlug || "");
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed.", issues: result.issues },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, data: result });
    }

    if (body.action === "save_personal") {
      const result = await saveApplicantPersonalDetails({
        firstName: body.firstName || "",
        lastName: body.lastName || "",
        phone: body.phone || "",
        personalStatement: body.personalStatement || "",
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed.", issues: result.issues },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === "get_documents") {
      const checklist = await getApplicationDocumentChecklist();
      return NextResponse.json({ success: true, data: checklist });
    }

    if (body.action === "confirm_document") {
      const result = await confirmApplicationDocument({
        documentType: (body.documentType || "") as DocumentType,
        filePath: body.filePath || "",
      });
      return NextResponse.json({ success: true, data: result });
    }

    if (body.action === "submit_review") {
      const result = await markApplicationReadyForReview();
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

    console.error("Applicant application POST error:", error);
    return NextResponse.json(
      { success: false, error: "Could not save application step." },
      { status: 500 }
    );
  }
}
