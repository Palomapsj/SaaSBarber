import { handleMockApi } from "@/server/mock/router";

// Mock API (see src/server/mock/router.ts). Replaced by the .NET API: then lib/api points to it
// and this route is deleted.
export const GET = handleMockApi;
export const POST = handleMockApi;
export const PUT = handleMockApi;
export const PATCH = handleMockApi;
export const DELETE = handleMockApi;
