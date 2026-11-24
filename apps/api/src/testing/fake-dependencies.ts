import type { AppDependencies } from "../container.js";
import type { Catalog } from "../modules/catalog/schemas.js";
import type { WeeklyReport } from "../modules/reports/schemas.js";
import type { NewService, Vehicle } from "../modules/services/application/ports.js";
import { RegisterService } from "../modules/services/application/register-service.js";
import type { ServiceStatus } from "../modules/services/infrastructure/schemas.js";
import type { NewPurchase, Supplier } from "../modules/supplies/application/ports.js";
import { RegisterPurchase } from "../modules/supplies/application/register-purchase.js";

// The whole app wired with in-memory data, so route tests run without Postgres.

export const catalogData: Catalog = {
  vehicleTypes: [{ id: 1, name: "Sedán" }],
  packages: [
    {
      id: 10,
      name: "Basic",
      description: "Lavado por dentro y por fuera.",
      includes: ["Aspirado"],
      durationMinutes: 50,
      prices: [{ vehicleTypeId: 1, priceCents: 18000 }],
    },
  ],
  extras: [
    {
      id: 20,
      name: "Alfombras",
      description: "Lavado profundo de alfombras.",
      prices: [{ vehicleTypeId: 1, priceCents: 8000 }],
    },
  ],
};

export function createFakeDependencies() {
  const vehicles: Vehicle[] = [];
  const services: Array<NewService & { id: number; status: ServiceStatus }> = [];
  const suppliers: Supplier[] = [{ id: 1, name: "Distribuidora de limpieza" }];
  const purchases: NewPurchase[] = [];

  const priceOf = (list: Catalog["packages"] | Catalog["extras"], id: number, typeId: number) => {
    const item = list.find((entry) => entry.id === id);
    const price = item?.prices.find((p) => p.vehicleTypeId === typeId);
    return item && price ? { id: item.id, name: item.name, priceCents: price.priceCents } : null;
  };

  const deps: AppDependencies = {
    catalog: { getCatalog: async () => catalogData },

    registerService: new RegisterService({
      catalog: {
        findPackagePrice: async (packageId, typeId) =>
          priceOf(catalogData.packages, packageId, typeId),
        findExtraPrices: async (ids, typeId) =>
          ids.flatMap((id) => priceOf(catalogData.extras, id, typeId) ?? []),
      },
      vehicles: {
        findByPlate: async (plate) => vehicles.find((v) => v.plate === plate) ?? null,
        create: async (vehicle) => {
          const row = { id: vehicles.length + 1, ...vehicle };
          vehicles.push(row);
          return row;
        },
      },
      services: {
        create: async (service) => {
          const row = { ...service, id: services.length + 1, status: "waiting" as const };
          services.push(row);
          return { id: row.id };
        },
      },
    }),

    serviceQueries: {
      listToday: async () =>
        services.map((service) => ({
          id: service.id,
          plate: vehicles.find((v) => v.id === service.vehicleId)?.plate ?? null,
          vehicleType: "Sedán",
          packageName: service.items[0]?.nameSnapshot ?? "",
          extras: service.items.filter((i) => i.kind === "extra").map((i) => i.nameSnapshot),
          status: service.status,
          paymentMethod: service.paymentMethod,
          totalCents: service.totalCents,
          performedAt: "2026-11-24T15:00:00.000Z",
        })),
      updateStatus: async (id, status) => {
        const service = services.find((s) => s.id === id);
        if (!service) {
          return null;
        }
        service.status = status;
        return { id, status };
      },
    },

    registerPurchase: new RegisterPurchase({
      suppliers: {
        findByName: async (name) =>
          suppliers.find((s) => s.name.toLowerCase() === name.toLowerCase()) ?? null,
        create: async (supplier) => {
          const row = { id: suppliers.length + 1, ...supplier };
          suppliers.push(row);
          return row;
        },
      },
      supplies: {
        findByIds: async (ids) =>
          [{ id: 1, name: "Shampoo para autos", defaultUnit: "litro" }].filter((s) =>
            ids.includes(s.id),
          ),
      },
      purchases: {
        create: async (purchase) => {
          purchases.push(purchase);
          return { id: purchases.length };
        },
      },
    }),

    supplyQueries: {
      listSupplies: async () => [{ id: 1, name: "Shampoo para autos", defaultUnit: "litro" }],
      listSuppliers: async () =>
        suppliers.map((s) => ({ ...s, phone: null, address: null, notes: null })),
    },

    reports: {
      weekly: async (date): Promise<WeeklyReport> => ({
        weekStart: date ?? "2026-11-23",
        weekEnd: "2026-11-29",
        servicesCount: 0,
        incomeCents: 0,
        averageTicketCents: 0,
        suppliesSpentCents: 0,
        netCents: 0,
        days: [],
      }),
    },
  };

  return { deps, data: { vehicles, services, suppliers, purchases } };
}
