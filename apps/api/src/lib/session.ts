import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../config/env";

type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  exp: number;
};

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const sign = (value: string) =>
  createHmac("sha256", env.JWT_REFRESH_SECRET).update(value).digest("base64url");

export const createSessionToken = (payload: Omit<SessionPayload, "exp">, maxAgeSeconds = 60 * 60 * 24 * 14) => {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };

  const serializedPayload = encode(JSON.stringify(fullPayload));
  const signature = sign(serializedPayload);

  return `${serializedPayload}.${signature}`;
};

export const verifySessionToken = (token: string) => {
  const [serializedPayload, providedSignature] = token.split(".");

  if (!serializedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = sign(serializedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  const payload = JSON.parse(decode(serializedPayload)) as SessionPayload;

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
};

export type { SessionPayload };
