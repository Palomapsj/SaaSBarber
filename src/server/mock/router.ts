import "server-only";
import type {
  BarberSelection,
  CreateAppointmentInput,
  PanelBarberInput,
  PanelRole,
  PanelServiceInput,
} from "@/lib/api/types";
import type { ScheduleBlockInput } from "@/lib/api/scheduleTypes";
import { SESSION_COOKIE, type Session, decodeSession } from "@/lib/auth/session";
import { agendaDay, barberAgendaDay } from "./agenda";
import { createAppointment, getAppointment } from "./appointments";
import { authenticate, barberStillExists, demoUser } from "./auth";
import { availableDays, timeSlots } from "./availability";
import { barberServicesPage, setBarberPerformsService } from "./barberServices";
import { barbersOf, clientCatalog, qualifiedBarbers, toPublicBarber } from "./catalog";
import { cancelMyAppointment, myAppointments, resendAccessLink } from "./clientAccess";
import { type MockDb, readDb, updateDb } from "./db";
import { MockApiError, notFound } from "./errors";
import { barbersPage, createBarber, removeBarber, setBarberActive, updateBarber } from "./panelBarbers";
import { createService, servicesPage, setServiceActive, updateService } from "./panelServices";
import { addBlock, barberSchedule, removeBlock, saveWeekly, scheduleBarbers } from "./schedules";

// The mock API: same paths and behavior the .NET API will have, served by
// app/api/mock/[...path]/route.ts and called by lib/api. Panel routes check the session cookie;
// "me" routes check the client's access code. The barbershop of the panel always comes from the
// session, never from the request.

type Handler = (ctx: {
  request: Request;
  params: string[];
  query: URLSearchParams;
  /** Read only by the routes that depend on the time (Next.js refuses the clock while prerendering). */
  now: () => Date;
}) => Promise<Response | unknown> | Response | unknown;

type Route = { method: string; pattern: string[]; handler: Handler };

const routes: Route[] = [];
const route = (method: string, path: string, handler: Handler) =>
  routes.push({ method, pattern: path.split("/").filter(Boolean), handler });

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

async function body<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new MockApiError(400, "VALIDATION", "Invalid JSON body");
  }
}

function read<T>(change: (db: MockDb) => T): T {
  return change(readDb());
}

function cookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

async function requireSession(request: Request, role: PanelRole): Promise<Session> {
  const session = await decodeSession(cookieValue(request, SESSION_COOKIE));
  if (!session) throw new MockApiError(401, "UNAUTHORIZED", "Login required");
  if (session.role !== role) throw new MockApiError(403, "FORBIDDEN", "Not allowed for this profile");
  if (role === "barber" && (!session.barberId || !read((db) => barberStillExists(db, session.barbershopId, session.barberId!)))) {
    throw new MockApiError(401, "UNAUTHORIZED", "Account no longer exists");
  }
  return session;
}

function bearer(request: Request): string {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}

function barberChoice(query: URLSearchParams): BarberSelection {
  const value = query.get("barber") ?? "any";
  return value === "any" ? { kind: "any" } : { kind: "barber", barberId: value };
}

const serviceIdsOf = (query: URLSearchParams) => (query.get("serviceIds") ?? "").split(",").filter(Boolean);

function requiredDate(query: URLSearchParams): string {
  const date = query.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new MockApiError(400, "VALIDATION", "Invalid date");
  return date;
}

// ── Public (client) ────────────────────────────────────────────────────────────────────────
route("GET", "barbershops/by-slug/:slug", ({ params: [slug] }) =>
  read((db) => {
    const shop = db.barbershops.find((s) => s.slug === slug.toLowerCase());
    if (!shop) throw notFound("Barbershop");
    return shop;
  }),
);
route("GET", "barbershops/:id/services", ({ params: [id] }) => read((db) => clientCatalog(db, id)));
route("GET", "barbershops/:id/barbers", ({ params: [id], query }) =>
  read((db) => {
    const list = query.has("serviceIds") ? qualifiedBarbers(db, id, serviceIdsOf(query)) : barbersOf(db, id);
    return list.map((b) => toPublicBarber(db, id, b));
  }),
);
route("GET", "barbershops/:id/availability/days", ({ params: [id], query, now }) =>
  read((db) => availableDays(db, { barbershopId: id, serviceIds: serviceIdsOf(query), barber: barberChoice(query) }, now())),
);
route("GET", "barbershops/:id/availability/slots", ({ params: [id], query, now }) =>
  read((db) =>
    timeSlots(db, { barbershopId: id, serviceIds: serviceIdsOf(query), barber: barberChoice(query), date: requiredDate(query) }, now()),
  ),
);
route("POST", "barbershops/:id/appointments", async ({ request, params: [id], now }) => {
  const input = await body<CreateAppointmentInput>(request);
  return json(201, updateDb((db) => createAppointment(db, { ...input, barbershopId: id }, now())));
});
route("GET", "appointments/:id", ({ params: [id] }) => read((db) => getAppointment(db, id)));
route("GET", "barbershops/:id/me/appointments", ({ request, params: [id], now }) =>
  read((db) => myAppointments(db, id, bearer(request), now())),
);
route("POST", "barbershops/:id/me/appointments/:appointmentId/cancel", ({ request, params: [id, appointmentId], now }) => {
  updateDb((db) => cancelMyAppointment(db, id, bearer(request), appointmentId, now()));
  return json(204, undefined);
});
route("POST", "barbershops/:id/client-access/resend", async ({ request, params: [id] }) => {
  const { phone, slug } = await body<{ phone: string; slug: string }>(request);
  const access = updateDb((db) => resendAccessLink(db, id, String(phone ?? "").replace(/\D/g, "")));
  if (access && process.env.NODE_ENV === "development") {
    const origin = new URL(request.url).origin;
    console.info(`[WhatsApp simulado] ${origin}/${slug}/meus-agendamentos?acesso=${access.token}`);
  }
  return json(202, undefined);
});

// ── Auth (used by the login server actions) ────────────────────────────────────────────────
route("POST", "auth/login", async ({ request }) => {
  const { identifier, password } = await body<{ identifier: string; password: string }>(request);
  const user = read((db) => authenticate(db, String(identifier ?? ""), String(password ?? "")));
  if (!user) throw new MockApiError(401, "UNAUTHORIZED", "Invalid credentials");
  return user;
});
route("GET", "auth/demo-user", ({ query }) => read((db) => demoUser(db, query.get("role") === "admin" ? "admin" : "barber")));

// ── Panel ─────────────────────────────────────────────────────────────────────────────────
route("GET", "panel/agenda", async ({ request, query }) => {
  const session = await requireSession(request, "admin");
  return read((db) => agendaDay(db, session.barbershopId, requiredDate(query)));
});
route("GET", "panel/me/agenda", async ({ request, query }) => {
  const session = await requireSession(request, "barber");
  return read((db) => barberAgendaDay(db, session.barbershopId, session.barberId!, requiredDate(query)));
});
route("GET", "panel/me/services", async ({ request }) => {
  const session = await requireSession(request, "barber");
  return read((db) => barberServicesPage(db, session.barbershopId, session.barberId!));
});
route("PUT", "panel/me/services/:id", async ({ request, params: [serviceId] }) => {
  const session = await requireSession(request, "barber");
  const { performed } = await body<{ performed: boolean }>(request);
  return updateDb((db) => setBarberPerformsService(db, session.barbershopId, session.barberId!, serviceId, performed === true));
});
route("GET", "panel/barbers", async ({ request }) => {
  const session = await requireSession(request, "admin");
  return read((db) => barbersPage(db, session.barbershopId));
});
route("POST", "panel/barbers", async ({ request }) => {
  const session = await requireSession(request, "admin");
  const input = await body<PanelBarberInput>(request);
  return json(201, updateDb((db) => createBarber(db, session.barbershopId, input)));
});
route("PUT", "panel/barbers/:id", async ({ request, params: [barberId] }) => {
  const session = await requireSession(request, "admin");
  const input = await body<PanelBarberInput>(request);
  return updateDb((db) => updateBarber(db, session.barbershopId, barberId, input));
});
route("PATCH", "panel/barbers/:id/active", async ({ request, params: [barberId] }) => {
  const session = await requireSession(request, "admin");
  const { active } = await body<{ active: boolean }>(request);
  return updateDb((db) => setBarberActive(db, session.barbershopId, barberId, active === true));
});
route("DELETE", "panel/barbers/:id", async ({ request, params: [barberId], now }) => {
  const session = await requireSession(request, "admin");
  updateDb((db) => removeBarber(db, session.barbershopId, barberId, now()));
  return json(204, undefined);
});

route("GET", "panel/services", async ({ request }) => {
  const session = await requireSession(request, "admin");
  return read((db) => servicesPage(db, session.barbershopId));
});
route("POST", "panel/services", async ({ request }) => {
  const session = await requireSession(request, "admin");
  const input = await body<PanelServiceInput>(request);
  return json(201, updateDb((db) => createService(db, session.barbershopId, input)));
});
route("PUT", "panel/services/:id", async ({ request, params: [serviceId] }) => {
  const session = await requireSession(request, "admin");
  const input = await body<PanelServiceInput>(request);
  return updateDb((db) => updateService(db, session.barbershopId, serviceId, input));
});
route("PATCH", "panel/services/:id/active", async ({ request, params: [serviceId] }) => {
  const session = await requireSession(request, "admin");
  const { active } = await body<{ active: boolean }>(request);
  return updateDb((db) => setServiceActive(db, session.barbershopId, serviceId, active === true));
});

// Working hours: the admin edits any barber; a barber only their own ("me", from the session).
route("GET", "panel/schedules", async ({ request }) => {
  const session = await requireSession(request, "admin");
  return read((db) => scheduleBarbers(db, session.barbershopId));
});

async function scheduleOwner(request: Request, barberId: string | null) {
  const session = await requireSession(request, barberId === null ? "barber" : "admin");
  return { shop: session.barbershopId, barberId: barberId ?? session.barberId! };
}

function scheduleRoutes(prefix: string, ownerParams: number) {
  const ownerOf = (request: Request, params: string[]) => scheduleOwner(request, ownerParams ? params[0] : null);
  route("GET", prefix, async ({ request, params }) => {
    const o = await ownerOf(request, params);
    return read((db) => barberSchedule(db, o.shop, o.barberId));
  });
  route("PUT", `${prefix}/weekly`, async ({ request, params, now }) => {
    const o = await ownerOf(request, params);
    const { weekly } = await body<{ weekly: unknown }>(request);
    return updateDb((db) => saveWeekly(db, o.shop, o.barberId, weekly, now()));
  });
  route("POST", `${prefix}/blocks`, async ({ request, params, now }) => {
    const o = await ownerOf(request, params);
    const input = await body<ScheduleBlockInput>(request);
    return json(201, updateDb((db) => addBlock(db, o.shop, o.barberId, input, now())));
  });
  route("DELETE", `${prefix}/blocks/:blockId`, async ({ request, params }) => {
    const o = await ownerOf(request, params);
    updateDb((db) => removeBlock(db, o.shop, o.barberId, params[ownerParams]));
    return json(204, undefined);
  });
}
scheduleRoutes("panel/me/schedule", 0);
scheduleRoutes("panel/schedules/:barberId", 1);

function match(method: string, segments: string[]) {
  for (const candidate of routes) {
    if (candidate.method !== method || candidate.pattern.length !== segments.length) continue;
    const params: string[] = [];
    const ok = candidate.pattern.every((part, i) => {
      if (part.startsWith(":")) {
        params.push(decodeURIComponent(segments[i]));
        return true;
      }
      return part === segments[i];
    });
    if (ok) return { handler: candidate.handler, params };
  }
  return null;
}

/** Entry point: a Request to /api/mock/… in, a JSON Response out. */
export async function handleMockApi(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.replace(/^\/api\/mock\/?/, "").split("/").filter(Boolean);
  const found = match(request.method, segments);
  if (!found) return json(404, { error: { code: "NOT_FOUND", message: "Unknown endpoint" } });
  try {
    const result = await found.handler({ request, params: found.params, query: url.searchParams, now: () => new Date() });
    return result instanceof Response ? result : json(200, result);
  } catch (error) {
    if (error instanceof MockApiError) {
      return json(error.status, { error: { code: error.code, message: error.message, ...error.details } });
    }
    console.error("[mock api]", error);
    return json(500, { error: { code: "INTERNAL", message: "Unexpected error" } });
  }
}
