import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findOrCreateCustomer, createPixCharge, createCreditCardCharge } from "@/lib/asaas";

const digits = (s: string) => s.replace(/\D/g, "");

const pixSchema = z.object({
  method: z.literal("PIX"),
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(254).toLowerCase().trim(),
});

const cardSchema = z.object({
  method: z.literal("CARD"),
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(254).toLowerCase().trim(),
  cpfCnpj: z.string().transform(digits).pipe(z.string().min(11).max(14)),
  phone: z.string().transform(digits).pipe(z.string().min(10).max(11)),
  postalCode: z.string().transform(digits).pipe(z.string().length(8)),
  addressNumber: z.string().min(1).max(20).trim(),
  cardHolder: z.string().min(2).max(100).trim(),
  cardNumber: z.string().transform(digits).pipe(z.string().min(13).max(19)),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/),
  expiryYear: z.string().regex(/^\d{4}$/),
  ccv: z.string().regex(/^\d{3,4}$/),
});

const checkoutSchema = z.discriminatedUnion("method", [pixSchema, cardSchema]);

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
      { error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    if (parsed.data.method === "PIX") {
      const { name, email } = parsed.data;
      const customerId = await findOrCreateCustomer(name, email);
      const { paymentId, qrCode } = await createPixCharge(customerId);
      return NextResponse.json({ method: "PIX", paymentId, qrCode });
    } else {
      const { name, email, cpfCnpj, phone, postalCode, addressNumber, cardHolder, cardNumber, expiryMonth, expiryYear, ccv } = parsed.data;
      const customerId = await findOrCreateCustomer(name, email);
      const { paymentId } = await createCreditCardCharge(customerId, {
        holderName: cardHolder,
        number: cardNumber,
        expiryMonth,
        expiryYear,
        ccv,
        holderInfo: { name, email, cpfCnpj, phone, postalCode, addressNumber },
      });
      return NextResponse.json({ method: "CARD", paymentId });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[checkout] error:", msg);
    const userMsg = msg.includes("Asaas API error")
      ? "Pagamento recusado. Verifique os dados do cartão."
      : "Erro ao processar. Tente novamente.";
    return NextResponse.json({ error: userMsg }, { status: 502 });
  }
}
