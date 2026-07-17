import "dotenv/config";
import { z } from "zod";

const optionalEnvString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().min(1).optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().trim().min(1),
  DIRECT_URL: z.string().trim().min(1),
  GOOGLE_CLIENT_ID: z.string().trim().min(1),
  GOOGLE_CLIENT_SECRET: z.string().trim().min(1),
  GOOGLE_CALLBACK_URL: z.string().trim().url(),
  GEMINI_API_KEY: z.string().trim().min(1),
  JWT_ACCESS_SECRET: z.string().trim().min(1),
  JWT_REFRESH_SECRET: z.string().trim().min(1),
  SESSION_COOKIE_NAME: z.string().trim().min(1).default("skillsync_session"),
  NEXT_PUBLIC_API_URL: z.string().trim().url().default("http://localhost:4000"),
  NEXT_PUBLIC_APP_URL: z.string().trim().url().default("http://localhost:3000"),
  STUN_SERVER_URL: z.string().trim().min(1).default("stun:stun.l.google.com:19302"),
  TURN_SERVER_URL: optionalEnvString,
  TURN_SERVER_USERNAME: optionalEnvString,
  TURN_SERVER_CREDENTIAL: optionalEnvString,
});

export const env = envSchema.parse(process.env);
