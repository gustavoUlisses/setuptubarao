import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookToken, getCustomerEmail } from "@/lib/asaas";
import { createDownloadToken, markPaymentProcessed } from "@/lib/tokens";
import { sendDownloadEmail } from "@/lib/resend";

const CONFIRMED_STATUSES = new Set(["RECEIVED", "CONFIRMED"]);

export async function POST(req: NextRequest) {
  const token =
    req.headers.get("asaas-access-token") ??
    req.headers.get("access_token") ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!verifyWebhookToken(token ?? null)) {
    console.error("[webhook] invalid token, received:", token?.slice(0, 20));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body as {
    event?: string;
    payment?: {
      id?: string;
      status?: string;
      customer?: string;
      customerEmail?: string;
    };
  };

  if (event.event !== "PAYMENT_RECEIVED" && event.event !== "PAYMENT_CONFIRMED") {
    return NextResponse.json({ ok: true });
  }

  const payment = event.payment;
  if (!payment?.id || !payment?.status) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!CONFIRMED_STATUSES.has(payment.status)) {
    return NextResponse.json({ ok: true });
  }

  const isNew = await markPaymentProcessed(payment.id);
  if (!isNew) {
    return NextResponse.json({ ok: true });
  }

  // Asaas nem sempre inclui customerEmail no payload — busca via API se necessário
  let email: string | undefined = payment.customerEmail;
  if (!email && payment.customer) {
    email = await getCustomerEmail(payment.customer);
  }

  if (!email) {
    console.error("[webhook] missing email for payment", payment.id);
    return NextResponse.json({ error: "Missing customer email" }, { status: 400 });
  }

  try {
    const downloadToken = await createDownloadToken(payment.id, email);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://setupbigplayer.vercel.app";
    const downloadUrl = `${baseUrl}/api/download/${downloadToken}`;

    await sendDownloadEmail(email, downloadUrl);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] delivery error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Delivery failed" }, { status: 500 });
  }
}
