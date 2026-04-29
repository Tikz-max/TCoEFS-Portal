import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrainingProgrammeOptions } from "@/features/training";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const rows = await getTrainingProgrammeOptions();
    return NextResponse.json({
      success: true,
      data: rows,
      source: rows.some((row) => row.id.startsWith("fallback-")) ? "fallback" : "database",
    });
  } catch (error) {
    console.error("Training programmes API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load training programmes.",
      },
      { status: 500 }
    );
  }
}
