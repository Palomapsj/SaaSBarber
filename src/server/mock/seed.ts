import type { Barbershop, Service, ServiceCategory } from "@/lib/api/types";
import type { MockAccessRecord, MockAdmin, MockAppointmentRecord, MockBarber, MockDb } from "./db";

// Initial data of the mock "server" (prototype: cliente/*.html and admin/*.html).

const barbershops: Barbershop[] = [
  {
    id: "bs_novaera",
    slug: "novaera",
    name: "Barbearia Nova Era",
    address: { street: "Rua das Tesouras", number: "123", district: "Vila Nova", city: "São Paulo", state: "SP" },
    openingHours: ([1, 2, 3, 4, 5, 6] as const).map((weekday) => ({ weekday, opens: "09:00", closes: "20:00" })),
    cancellationNoticeHours: 3,
    recurrenceIntervalWeeks: 3,
    plan: { name: "Pro", maxBarbers: 5 },
  },
];

const categories: Record<string, ServiceCategory[]> = {
  bs_novaera: [
    { id: "cat_cabelo", name: "Cabelo" },
    { id: "cat_barba", name: "Barba" },
  ],
};

const services: Record<string, Service[]> = {
  bs_novaera: [
    { id: "svc_corte", categoryId: "cat_cabelo", name: "Corte de cabelo", durationMinutes: 30, priceCents: 4500, active: true },
    { id: "svc_corte_sobrancelha", categoryId: "cat_cabelo", name: "Corte + Sobrancelha", durationMinutes: 40, priceCents: 5500, active: true },
    { id: "svc_barba", categoryId: "cat_barba", name: "Barba completa", durationMinutes: 25, priceCents: 3500, active: true },
    { id: "svc_barboterapia", categoryId: "cat_barba", name: "Barboterapia", durationMinutes: 35, priceCents: 5000, active: true },
  ],
};

const barbers: Record<string, MockBarber[]> = {
  bs_novaera: [
    {
      id: "brb_carlos",
      name: "Carlos Andrade",
      serviceIds: ["svc_corte", "svc_barba"],
      active: true,
      commissionPercent: 40,
      phone: "11912345678",
      email: "carlos@barbearianovaera.com",
      hasSampleAgenda: true,
    },
    {
      id: "brb_rafael",
      name: "Rafael Alves",
      serviceIds: ["svc_corte", "svc_corte_sobrancelha"],
      active: true,
      commissionPercent: 35,
      phone: "11923456789",
      email: "rafael@barbearianovaera.com",
      hasSampleAgenda: true,
    },
    {
      id: "brb_diego",
      name: "Diego Ibra",
      serviceIds: ["svc_barba", "svc_barboterapia"],
      active: true,
      commissionPercent: 40,
      phone: "11934567890",
      email: "diego@barbearianovaera.com",
      hasSampleAgenda: true,
    },
  ],
};

const admins: MockAdmin[] = [
  {
    id: "usr_admin",
    barbershopId: "bs_novaera",
    name: "Dono Nova Era",
    email: "dono@barbearianovaera.com",
    phone: "11900000001",
  },
];

export function initialDb(): MockDb {
  return structuredClone({
    barbershops,
    categories,
    services,
    barbers,
    admins,
    appointments: [] as MockAppointmentRecord[],
    clientAccess: [] as MockAccessRecord[],
  });
}
