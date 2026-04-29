import { NextResponse } from "next/server";
import {
  createAdminTrainingProgramme,
  getAdminTrainingList,
} from "@/features/training/workspace";

export async function GET() {
  try {
    const data = await getAdminTrainingList();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Not allowed." },
        { status: 403 }
      );
    }

    console.error("Admin training list error:", error);
    return NextResponse.json(
      { success: false, error: "Could not load training list." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await createAdminTrainingProgramme({
      title: String(body?.title || ""),
      slug: typeof body?.slug === "string" ? body.slug : undefined,
      description: String(body?.description || ""),
      venue: typeof body?.venue === "string" ? body.venue : null,
      fees: Number(body?.fees || 0),
      capacity: body?.capacity === null || body?.capacity === undefined ? null : Number(body.capacity),
      status: body?.status,
      breadcrumbLabel: typeof body?.breadcrumbLabel === "string" ? body.breadcrumbLabel : null,
      categoryLabel: typeof body?.categoryLabel === "string" ? body.categoryLabel : null,
      modeLabel: typeof body?.modeLabel === "string" ? body.modeLabel : null,
      durationLabel: typeof body?.durationLabel === "string" ? body.durationLabel : null,
      feeSubLabel: typeof body?.feeSubLabel === "string" ? body.feeSubLabel : null,
      registrationDeadline: typeof body?.registrationDeadline === "string" ? body.registrationDeadline : null,
      outcomes: Array.isArray(body?.outcomes) ? body.outcomes.map(String) : [],
      audience: Array.isArray(body?.audience) ? body.audience.map(String) : [],
      contactEmail: typeof body?.contactEmail === "string" ? body.contactEmail : null,
      contactPhone: typeof body?.contactPhone === "string" ? body.contactPhone : null,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Not allowed." }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not create training programme." },
      { status: 400 }
    );
  }
}
