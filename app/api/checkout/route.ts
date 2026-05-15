import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findOrCreateCustomer, createCharge } from "@/lib/asaas";

const checkoutSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(254).toLowerCase().trim(),
  cpfCnpj: z.string().min(11).max(18).trim().transform((v) => v.replace(/\D/g, "")),
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

  const { name, email, cpfCnpj } = parsed.data;

  try {
    const customerId = await findOrCreateCustomer(name, email, cpfCnpj);
    const { paymentId, invoiceUrl } = await createCharge(
      customerId,
      "SetupTubarão — Licença de uso"
    );

    return NextResponse.json({ paymentId, invoiceUrl });
  } catch (err) {
    console.error("[checkout] error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Payment creation failed. Please try again." },
      { status: 502 }
    );
  }
}
