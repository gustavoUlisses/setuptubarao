import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/asaas";

const PAID_STATUSES = new Set(["RECEIVED", "CONFIRMED"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;

  if (!paymentId || typeof paymentId !== "string" || paymentId.length > 100) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const status = await getPaymentStatus(paymentId);
    const paid = PAID_STATUSES.has(status);
    return NextResponse.json({ status, paid });
  } catch (err) {
    console.error("[status] error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Status check failed" }, { status: 502 });
  }
}
