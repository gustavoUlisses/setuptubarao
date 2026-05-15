import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TTL_SECONDS = 60 * 60 * 24; // 24 horas

interface TokenData {
  paymentId: string;
  email: string;
  used: boolean;
  createdAt: number;
}

function redisKey(token: string): string {
  return `dl:${token}`;
}

export async function createDownloadToken(
  paymentId: string,
  email: string
): Promise<string> {
  const token = crypto.randomUUID();
  const data: TokenData = {
    paymentId,
    email,
    used: false,
    createdAt: Date.now(),
  };

  await redis.set(redisKey(token), JSON.stringify(data), { ex: TTL_SECONDS });
  return token;
}

export type TokenValidationResult =
  | { valid: true; data: TokenData }
  | { valid: false; reason: "not_found" | "expired" | "already_used" };

export async function validateAndConsumeToken(
  token: string
): Promise<TokenValidationResult> {
  const key = redisKey(token);
  const raw = await redis.get<string>(key);

  if (!raw) {
    return { valid: false, reason: "not_found" };
  }

  const data: TokenData =
    typeof raw === "string" ? JSON.parse(raw) : (raw as TokenData);

  if (data.used) {
    return { valid: false, reason: "already_used" };
  }

  const updatedData: TokenData = { ...data, used: true };
  await redis.set(key, JSON.stringify(updatedData), { ex: TTL_SECONDS });

  return { valid: true, data };
}

export async function markPaymentProcessed(paymentId: string): Promise<boolean> {
  const key = `processed:${paymentId}`;
  const result = await redis.set(key, "1", { ex: TTL_SECONDS * 7, nx: true });
  return result === "OK";
}
