import { NextResponse } from "next/server";
import {
  ALLOWED_RECEIPT_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  buildDocumentKey,
  generatePresignedUploadUrl,
  validateUpload,
} from "@/lib/storage/upload";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      category?: "applicationDocument" | "trainingDocument" | "paymentReceipt";
      contextId?: string;
      filename?: string;
      contentType?: string;
      contentLength?: number;
    };

    const category = body.category || "applicationDocument";
    const contextId = (body.contextId || "").trim();
    const filename = (body.filename || "").trim();
    const contentType = (body.contentType || "").trim();
    const contentLength = Number(body.contentLength || 0);

    if (!contextId || !filename || !contentType || !contentLength) {
      return NextResponse.json(
        { success: false, error: "Missing required upload metadata." },
        { status: 400 }
      );
    }

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

    const allowedTypes =
      category === "paymentReceipt"
        ? ALLOWED_RECEIPT_TYPES
        : ALLOWED_DOCUMENT_TYPES;

    validateUpload(contentType, contentLength, allowedTypes);
    const key = buildDocumentKey(category, user.id, contextId, filename);
    const result = await generatePresignedUploadUrl({
      key,
      contentType,
      contentLength,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Presign upload API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate upload URL.",
      },
      { status: 400 }
    );
  }
}
