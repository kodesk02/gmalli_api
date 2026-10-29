import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function parseEmailList(raw: string): string[] {
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const env = {
  port:               parseInt(process.env.PORT ?? "3002", 10),
  nodeEnv:            process.env.NODE_ENV ?? "development",
  databaseUrl:        required("DATABASE_URL"),
  supabaseUrl:        required("SUPABASE_URL"),
  supabaseServiceKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  adminFrontendUrl:   process.env.ADMIN_FRONTEND_URL ?? "http://localhost:3003",
  adminEmails:        parseEmailList(required("ADMIN_EMAILS")),
} as const;