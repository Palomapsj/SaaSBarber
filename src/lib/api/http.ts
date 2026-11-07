// HTTP client used by every lib/api function in the browser. Today it talks to the mock API
// (/api/mock, see src/server/mock); for the .NET API only API_BASE changes.

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/mock";

/** An error answer from the API: HTTP status, a stable code and optional details. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The time was taken by someone else (409 SLOT_UNAVAILABLE). */
export class SlotUnavailableError extends ApiError {}
/** The client's access code is unknown, expired or revoked (401 INVALID_ACCESS). */
export class InvalidAccessError extends ApiError {}
/** Too late to cancel or reschedule (409 CHANGE_NOT_ALLOWED). */
export class ChangeNotAllowedError extends ApiError {}
/** Some fields were refused (422 VALIDATION); `fields` maps field name → message. */
export class ValidationError extends ApiError {
  get fields(): Record<string, string> {
    return (this.details.fields as Record<string, string>) ?? {};
  }
}
/** The plan does not allow more barbers (409 PLAN_LIMIT). */
export class PlanLimitError extends ApiError {}
/** Cannot remove a barber who still has future appointments (409 HAS_FUTURE_APPOINTMENTS). */
export class HasFutureAppointmentsError extends ApiError {
  get count(): number {
    return Number(this.details.count ?? 0);
  }
}

/** A barber tried to uncheck their last active service (409 LAST_SERVICE). */
export class LastServiceError extends ApiError {}

const ERRORS: Record<string, typeof ApiError> = {
  SLOT_UNAVAILABLE: SlotUnavailableError,
  INVALID_ACCESS: InvalidAccessError,
  CHANGE_NOT_ALLOWED: ChangeNotAllowedError,
  VALIDATION: ValidationError,
  PLAN_LIMIT: PlanLimitError,
  HAS_FUTURE_APPOINTMENTS: HasFutureAppointmentsError,
  LAST_SERVICE: LastServiceError,
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Client access code (Authorization: Bearer). */
  token?: string;
};

/** Turns an API response into data, or throws the matching typed error. */
export async function readApiResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (response.status === 204 || response.status === 202 ? undefined : await response.json()) as T;
  }
  let payload: { code?: string; message?: string } & Record<string, unknown> = {};
  try {
    payload = ((await response.json()) as { error?: typeof payload }).error ?? {};
  } catch {
    // Not JSON (network proxy, crash page…): keep the generic error.
  }
  const { code = "UNKNOWN", message = `Request failed with ${response.status}`, ...details } = payload;
  const ErrorClass = ERRORS[code] ?? ApiError;
  throw new ErrorClass(response.status, code, message, details);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: "same-origin",
  });
  return readApiResponse<T>(response);
}

/** "?a=1&b=2" from an object, skipping empty values. */
export function queryString(values: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
  const text = params.toString();
  return text ? `?${text}` : "";
}
