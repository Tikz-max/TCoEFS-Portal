import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAdminApplications,
  getAdminApplicationDetail,
  approveApplication,
  rejectApplication,
} from "@/features/admin";

const approveSchema = z.object({});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const applications = await getAdminApplications({ status, search });
    return NextResponse.json({ success: true, data: applications });
  } catch (error) {
    console.error("List applications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load applications." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, applicationId, reason } = body;

    if (action === "approve") {
      await approveApplication(applicationId);
      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "Rejection reason is required." },
          { status: 400 }
        );
      }
      await rejectApplication(applicationId, reason);
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
    console.error("Application action error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process application." },
      { status: 500 }
    );
  }
}