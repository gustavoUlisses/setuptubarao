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
  status: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeId?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
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
  email: string
): Promise<string> {
  const search = await asaasRequest<{ data: AsaasCustomer[] }>(
    `/customers?email=${encodeURIComponent(email)}&limit=1`
  );

  if (search.data.length > 0) {
    return search.data[0].id;
  }

  const customer = await asaasRequest<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({ name, email }),
  });

  return customer.id;
}

export async function createPixCharge(
  customerId: string
): Promise<{ paymentId: string; qrCode: AsaasPixQrCode }> {
  const priceCents = parseInt(process.env.PRODUCT_PRICE_CENTS!, 10);
  const value = priceCents / 100;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1);
  const dueDateStr = dueDate.toISOString().split("T")[0];

  const payment = await asaasRequest<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      value,
      dueDate: dueDateStr,
      description: "SetupTubarão — Licença de uso",
      externalReference: process.env.PRODUCT_ID,
    }),
  });

  const qrCode = await asaasRequest<AsaasPixQrCode>(
    `/payments/${payment.id}/pixQrCode`
  );

  return { paymentId: payment.id, qrCode };
}

interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  holderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    postalCode: string;
    addressNumber: string;
  };
}

export async function createCreditCardCharge(
  customerId: string,
  card: CreditCardData
): Promise<{ paymentId: string }> {
  const priceCents = parseInt(process.env.PRODUCT_PRICE_CENTS!, 10);
  const value = priceCents / 100;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1);
  const dueDateStr = dueDate.toISOString().split("T")[0];

  const payment = await asaasRequest<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "CREDIT_CARD",
      value,
      dueDate: dueDateStr,
      description: "SetupTubarão — Licença de uso",
      externalReference: process.env.PRODUCT_ID,
      creditCard: {
        holderName: card.holderName,
        number: card.number,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        ccv: card.ccv,
      },
      creditCardHolderInfo: {
        name: card.holderInfo.name,
        email: card.holderInfo.email,
        cpfCnpj: card.holderInfo.cpfCnpj,
        phone: card.holderInfo.phone,
        postalCode: card.holderInfo.postalCode,
        addressNumber: card.holderInfo.addressNumber,
      },
    }),
  });

  return { paymentId: payment.id };
}

export async function getPaymentStatus(paymentId: string): Promise<string> {
  const payment = await asaasRequest<AsaasPayment>(`/payments/${paymentId}`);
  return payment.status;
}

export async function getCustomerEmail(
  customerId: string
): Promise<string | undefined> {
  try {
    const customer = await asaasRequest<AsaasCustomer>(
      `/customers/${customerId}`
    );
    return customer.email ?? undefined;
  } catch {
    return undefined;
  }
}

export function verifyWebhookToken(token: string | null): boolean {
  if (!token) return false;
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return false;
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
