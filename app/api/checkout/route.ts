import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findOrCreateCustomer, createPixCharge, createCardCharge } from "@/lib/asaas";

const checkoutSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(254).toLowerCase().trim(),
  method: z.enum(["PIX", "CARD"]).default("PIX"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, email, method } = parsed.data;

  try {
    const customerId = await findOrCreateCustomer(name, email);

    if (method === "PIX") {
      const { paymentId, qrCode } = await createPixCharge(customerId);
      return NextResponse.json({ method: "PIX", paymentId, qrCode });
    } else {
      const { paymentId, invoiceUrl } = await createCardCharge(customerId);
      return NextResponse.json({ method: "CARD", paymentId, invoiceUrl });
    }
  } catch (err) {
    console.error("[checkout] error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Payment creation failed. Please try again." },
      { status: 502 }
    );
  }
}
