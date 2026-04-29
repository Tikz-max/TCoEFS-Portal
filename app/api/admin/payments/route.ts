import { NextResponse } from "next/server";
import { getAdminPaymentList } from "@/features/payments";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

    const result = await getAdminPaymentList({
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "You are not allowed to access payment reviews." },
        { status: 403 }
      );
    }

    console.error("Admin payment list API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to fetch admin payment list.",
      },
      { status: 500 }
    );
  }
}
