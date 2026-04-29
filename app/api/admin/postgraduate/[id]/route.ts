import { NextResponse } from "next/server";
import {
  deleteAdminPostgraduateProgramme,
  getAdminPostgraduateProgramme,
  updateAdminPostgraduateProgramme,
} from "@/features/postgraduate/catalogue";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const data = await getAdminPostgraduateProgramme(resolved.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Not allowed." }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ success: false, error: "Programme not found." }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: "Could not load postgraduate programme." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const body = await request.json();
    const data = await updateAdminPostgraduateProgramme(resolved.id, {
      title: typeof body?.title === "string" ? body.title : undefined,
      slug: typeof body?.slug === "string" ? body.slug : undefined,
      code: typeof body?.code === "string" ? body.code : undefined,
      status: body?.status,
      deadline: typeof body?.deadline === "string" ? body.deadline : undefined,
      start_date: typeof body?.start_date === "string" ? body.start_date : undefined,
      mode: typeof body?.mode === "string" ? body.mode : undefined,
      duration: typeof body?.duration === "string" ? body.duration : undefined,
      fees: body?.fees === undefined ? undefined : Number(body.fees),
      overview: typeof body?.overview === "string" ? body.overview : undefined,
      outcomes: Array.isArray(body?.outcomes) ? body.outcomes.map(String) : undefined,
      eligibility: typeof body?.eligibility === "string" ? body.eligibility : undefined,
      required_documents: Array.isArray(body?.required_documents) ? body.required_documents.map(String) : undefined,
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
      return NextResponse.json({ success: false, error: "Programme not found." }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Could not update postgraduate programme." }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const data = await deleteAdminPostgraduateProgramme(resolved.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Not allowed." }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Could not delete postgraduate programme." }, { status: 400 });
  }
}
