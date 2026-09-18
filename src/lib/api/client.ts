import type { ApiResponse } from "./response";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "same-origin",
  });

  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    // fallthrough — handled below
  }

  if (!body) {
    throw new ApiError("BAD_RESPONSE", `Unexpected response (${res.status}).`, res.status);
  }
  if (!body.ok) {
    throw new ApiError(body.error.code, body.error.message, res.status, body.error.fields);
  }
  return body.data;
}
