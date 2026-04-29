import { NextResponse } from "next/server";
import {
  createAdminPostgraduateProgramme,
  getAdminPostgraduateProgrammes,
} from "@/features/postgraduate/catalogue";

export async function GET() {
  try {
    const data = await getAdminPostgraduateProgrammes();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Not allowed." }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: "Could not load postgraduate programmes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await createAdminPostgraduateProgramme({
      title: String(body?.title || ""),
      slug: typeof body?.slug === "string" ? body.slug : undefined,
      code: String(body?.code || ""),
      status: body?.status,
      deadline: String(body?.deadline || ""),
      start_date: String(body?.start_date || ""),
      mode: String(body?.mode || ""),
      duration: String(body?.duration || ""),
      fees: Number(body?.fees || 0),
      overview: String(body?.overview || ""),
      outcomes: Array.isArray(body?.outcomes) ? body.outcomes.map(String) : [],
      eligibility: String(body?.eligibility || ""),
      required_documents: Array.isArray(body?.required_documents) ? body.required_documents.map(String) : [],
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Not allowed." }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Could not create postgraduate programme." }, { status: 400 });
  }
}
