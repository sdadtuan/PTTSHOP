import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError("Dữ liệu không hợp lệ", 400, {
      issues: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }
  if (err instanceof ApiError) {
    return jsonError(err.message, err.status, err.extra);
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Lỗi máy chủ";
  return jsonError(message, 500);
}

export class ApiError extends Error {
  status: number;
  extra?: Record<string, unknown>;

  constructor(
    message: string,
    status = 400,
    extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.extra = extra;
  }
}
