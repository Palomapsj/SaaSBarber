// Errors of the mock "server", sent as JSON: { error: { code, message, ...details } } with an
// HTTP status. The client (lib/api/http.ts) turns them back into typed errors.

export type MockErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "SLOT_UNAVAILABLE"
  | "CHANGE_NOT_ALLOWED"
  | "INVALID_ACCESS"
  | "PLAN_LIMIT"
  | "HAS_FUTURE_APPOINTMENTS"
  | "LAST_SERVICE";

export class MockApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: MockErrorCode,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "MockApiError";
  }
}

export const notFound = (what: string) => new MockApiError(404, "NOT_FOUND", `${what} not found`);
