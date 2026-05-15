import { NextRequest, NextResponse } from "next/server";
import { validateAndConsumeToken } from "@/lib/tokens";
import { getProductBlob, BLOB_FILENAME } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || typeof token !== "string" || token.length > 128) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await validateAndConsumeToken(token);

  if (!result.valid) {
    const status = result.reason === "not_found" ? 404 : 410;
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status });
  }

  try {
    const { stream, size, contentType } = await getProductBlob();

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${BLOB_FILENAME}"`,
        "Content-Length": String(size),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[download] storage error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Download unavailable" }, { status: 503 });
  }
}
