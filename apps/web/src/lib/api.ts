// A tiny typed client for the API. Every call goes to /api, which Vite forwards to Fastify.

export type ServiceStatus = "waiting" | "washing" | "ready" | "delivered" | "cancelled";
export type PaymentMethod = "cash" | "transfer";

interface Price {
  vehicleTypeId: number;
  priceCents: number;
}

export interface Catalog {
  vehicleTypes: Array<{ id: number; name: string }>;
  packages: Array<{
    id: number;
    name: string;
    description: string;
    includes: string[];
    durationMinutes: number;
    prices: Price[];
  }>;
  extras: Array<{ id: number; name: string; description: string; prices: Price[] }>;
}

export interface TodayService {
  id: number;
  plate: string | null;
  vehicleType: string;
  packageName: string;
  extras: string[];
  status: ServiceStatus;
  paymentMethod: PaymentMethod;
  totalCents: number;
  performedAt: string;
}

export interface Supply {
  id: number;
  name: string;
  defaultUnit: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  servicesCount: number;
  incomeCents: number;
  averageTicketCents: number;
  suppliesSpentCents: number;
  netCents: number;
  days: Array<{ date: string; servicesCount: number; incomeCents: number }>;
}

export interface NewService {
  plate?: string | null;
  vehicleTypeId: number;
  packageId: number;
  extraIds?: number[];
  paymentMethod?: PaymentMethod;
  notes?: string | null;
}

export interface NewPurchase {
  supplierName: string;
  purchasedOn?: string | null;
  notes?: string | null;
  items: Array<{ supplyId: number; quantity: number; unit?: string | null; totalCents: number }>;
}

// An error the API explained (400, 404, 422), with a message we can show.
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body ? { "content-type": "application/json" } : undefined,
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? "Algo salió mal, intenta de nuevo");
  }
  return body as T;
}

export const api = {
  catalog: () => request<Catalog>("/catalog"),
  todayServices: () => request<TodayService[]>("/services/today"),
  registerService: (service: NewService) =>
    request<{ id: number; totalCents: number }>("/services", {
      method: "POST",
      body: JSON.stringify(service),
    }),
  updateStatus: (id: number, status: ServiceStatus) =>
    request<{ id: number; status: ServiceStatus }>(`/services/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  supplies: () => request<Supply[]>("/supplies"),
  suppliers: () => request<Supplier[]>("/suppliers"),
  registerPurchase: (purchase: NewPurchase) =>
    request<{ id: number; supplierCreated: boolean; totalCents: number }>("/purchases", {
      method: "POST",
      body: JSON.stringify(purchase),
    }),
  weeklyReport: (date?: string | null) =>
    request<WeeklyReport>(`/reports/weekly${date ? `?date=${encodeURIComponent(date)}` : ""}`),
};
