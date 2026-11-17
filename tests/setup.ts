import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env") });

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || "file:./test.db";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-secret-vitest";
process.env.AUTH_URL = process.env.AUTH_URL || "http://localhost:3000";
