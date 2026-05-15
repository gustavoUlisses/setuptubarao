const ASAAS_BASE_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";
  value: number;
  dueDate: string;
  description: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeId?: string;
  status: string;
}

async function asaasRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: process.env.ASAAS_API_KEY!,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Asaas API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function findOrCreateCustomer(
  name: string,
  email: string,
  cpfCnpj: string
): Promise<string> {
  const search = await asaasRequest<{ data: AsaasCustomer[] }>(
    `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}&limit=1`
  );

  if (search.data.length > 0) {
    return search.data[0].id;
  }

  const customer = await asaasRequest<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({ name, email, cpfCnpj }),
  });

  return customer.id;
}

export async function createCharge(
  customerId: string,
  description: string
): Promise<{ paymentId: string; invoiceUrl: string }> {
  const priceCents = parseInt(process.env.PRODUCT_PRICE_CENTS!, 10);
  const value = priceCents / 100;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1);
  const dueDateStr = dueDate.toISOString().split("T")[0];

  const payment = await asaasRequest<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "UNDEFINED",
      value,
      dueDate: dueDateStr,
      description,
      externalReference: process.env.PRODUCT_ID,
    }),
  });

  return {
    paymentId: payment.id,
    invoiceUrl: payment.invoiceUrl ?? "",
  };
}

export function verifyWebhookToken(token: string | null): boolean {
  if (!token) return false;
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return false;
  return token === expected;
}
