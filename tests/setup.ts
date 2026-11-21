import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env") });

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || "file:./test.db";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-secret-vitest";
process.env.AUTH_URL = process.env.AUTH_URL || "http://localhost:3000";
process.env.E2E_ADMIN_EMAIL ||= "admin@test.local";
process.env.E2E_ADMIN_PASSWORD ||= "Local-admin-pass-1";
process.env.E2E_CUSTOMER_EMAIL ||= "customer@test.local";
process.env.E2E_CUSTOMER_PASSWORD ||= "Local-customer-pass-1";
