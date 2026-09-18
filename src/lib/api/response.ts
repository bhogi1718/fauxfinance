import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { TradingError } from "@/lib/trading/errors";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string; fields?: Record<string, string[]> } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function fail(code: string, message: string, status: number, fields?: Record<string, string[]>) {
  return NextResponse.json<ApiFailure>({ ok: false, error: { code, message, fields } }, { status });
}

export function unauthorized() {
  return fail("UNAUTHORIZED", "You need to be signed in to do that.", 401);
}

export function notFound(message = "Not found.") {
  return fail("NOT_FOUND", message, 404);
}

export function validationFailed(error: ZodError) {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (fields[key] ??= []).push(issue.message);
  }
  return fail("VALIDATION_FAILED", "Please check the highlighted fields.", 400, fields);
}

// Maps known domain errors to their status; everything else is logged and hidden from the client.
export function handleError(error: unknown, context: string) {
  if (error instanceof TradingError) {
    return fail(error.code, error.message, error.status);
  }
  console.error(`[api:${context}]`, error);
  return fail("INTERNAL_ERROR", "Something went wrong on our side. Please try again.", 500);
}
