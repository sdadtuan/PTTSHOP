import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { guardCredentialsCallback } from "@/lib/credentials-rate-limit";

export const GET = handlers.GET;

export function POST(req: NextRequest) {
  return guardCredentialsCallback(req, (request) => handlers.POST(request as NextRequest));
}
