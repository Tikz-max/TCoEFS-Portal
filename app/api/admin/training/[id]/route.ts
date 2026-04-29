import { NextResponse } from "next/server";
import {
  deleteAdminTrainingProgramme,
  getAdminTrainingDetail,
  updateAdminTrainingProgramme,
} from "@/features/training/workspace";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const data = await getAdminTrainingDetail(resolved.id);
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
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Training not found." },
        { status: 404 }
      );
    }

    console.error("Admin training detail error:", error);
    return NextResponse.json(
      { success: false, error: "Could not load training detail." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const body = await request.json();
    const data = await updateAdminTrainingProgramme(resolved.id, {
      title: typeof body?.title === "string" ? body.title : undefined,
      slug: typeof body?.slug === "string" ? body.slug : undefined,
      description: typeof body?.description === "string" ? body.description : undefined,
      venue: typeof body?.venue === "string" ? body.venue : undefined,
      fees: body?.fees === undefined ? undefined : Number(body.fees),
      capacity: body?.capacity === undefined ? undefined : body.capacity === null ? null : Number(body.capacity),
      status: body?.status,
      breadcrumbLabel: typeof body?.breadcrumbLabel === "string" ? body.breadcrumbLabel : undefined,
      categoryLabel: typeof body?.categoryLabel === "string" ? body.categoryLabel : undefined,
      modeLabel: typeof body?.modeLabel === "string" ? body.modeLabel : undefined,
      durationLabel: typeof body?.durationLabel === "string" ? body.durationLabel : undefined,
      feeSubLabel: typeof body?.feeSubLabel === "string" ? body.feeSubLabel : undefined,
      registrationDeadline: typeof body?.registrationDeadline === "string" ? body.registrationDeadline : undefined,
      outcomes: Array.isArray(body?.outcomes) ? body.outcomes.map(String) : undefined,
      audience: Array.isArray(body?.audience) ? body.audience.map(String) : undefined,
      contactEmail: typeof body?.contactEmail === "string" ? body.contactEmail : undefined,
      contactPhone: typeof body?.contactPhone === "string" ? body.contactPhone : undefined,
      feeType: body?.feeType === "tiered" ? "tiered" : "single",
      feeTiers: Array.isArray(body?.feeTiers) ? body.feeTiers : undefined,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Not allowed." }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ success: false, error: "Training not found." }, { status: 404 });
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not update training programme." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const data = await deleteAdminTrainingProgramme(resolved.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Not allowed." }, { status: 403 });
    }
    if (error instanceof Error && error.message === "HAS_REGISTRATIONS") {
      return NextResponse.json(
        { success: false, error: "Programmes with registrations cannot be deleted." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Could not delete training programme." },
      { status: 400 }
    );
  }
}
