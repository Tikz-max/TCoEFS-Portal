import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await request.text();
    return NextResponse.json({
      success: true,
      data: {
        disabled: true,
        message: "Remita webhook is disabled for manual payment flow.",
      },
    });
  } catch (error) {
    console.error("Remita webhook API error:", error);
    return NextResponse.json(
      {
        success: true,
        data: {
          disabled: true,
          message: "Remita webhook is disabled for manual payment flow.",
        },
      },
      { status: 200 }
    );
  }
}
