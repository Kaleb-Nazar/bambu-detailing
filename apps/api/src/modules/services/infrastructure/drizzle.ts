import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import type { Db } from "../../../db/client.js";
import {
  serviceItems,
  services,
  vehicles,
  vehicleTypes,
  washPackages,
} from "../../../db/schema.js";
import { BUSINESS_TIME_ZONE } from "../../../shared/time.js";
import type {
  NewService,
  ServiceRepository,
  Vehicle,
  VehicleRepository,
} from "../application/ports.js";
import type { ServiceQueries, ServiceStatus, TodayService } from "./schemas.js";

// Adapters: the Drizzle version of the ports (like an EloquentVehicleRepository).

export class DrizzleVehicleRepository implements VehicleRepository {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  async findByPlate(plate: string): Promise<Vehicle | null> {
    const [row] = await this.#db
      .select({ id: vehicles.id, plate: vehicles.plate, vehicleTypeId: vehicles.vehicleTypeId })
      .from(vehicles)
      .where(eq(vehicles.plate, plate));

    return row ?? null;
  }

  async create(vehicle: { plate: string; vehicleTypeId: number }): Promise<Vehicle> {
    const [row] = await this.#db.insert(vehicles).values(vehicle).returning({
      id: vehicles.id,
      plate: vehicles.plate,
      vehicleTypeId: vehicles.vehicleTypeId,
    });

    if (!row) {
      throw new Error("Vehicle was not created");
    }
    return row;
  }
}

export class DrizzleServiceRepository implements ServiceRepository {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  // The service and its items are saved together or not at all.
  async create({ items, ...service }: NewService): Promise<{ id: number }> {
    return this.#db.transaction(async (tx) => {
      const [row] = await tx.insert(services).values(service).returning({ id: services.id });
      if (!row) {
        throw new Error("Service was not created");
      }

      await tx.insert(serviceItems).values(items.map((item) => ({ ...item, serviceId: row.id })));
      return row;
    });
  }
}

export class DrizzleServiceQueries implements ServiceQueries {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  async listToday(): Promise<TodayService[]> {
    const startOfToday = sql`date_trunc('day', now() AT TIME ZONE ${BUSINESS_TIME_ZONE}) AT TIME ZONE ${BUSINESS_TIME_ZONE}`;

    const rows = await this.#db
      .select({
        id: services.id,
        plate: vehicles.plate,
        vehicleType: vehicleTypes.name,
        packageName: washPackages.name,
        status: services.status,
        paymentMethod: services.paymentMethod,
        totalCents: services.totalCents,
        performedAt: services.performedAt,
      })
      .from(services)
      .leftJoin(vehicles, eq(vehicles.id, services.vehicleId))
      .innerJoin(vehicleTypes, eq(vehicleTypes.id, services.vehicleTypeId))
      .innerJoin(washPackages, eq(washPackages.id, services.packageId))
      .where(gte(services.performedAt, startOfToday))
      .orderBy(asc(services.performedAt));

    const ids = rows.map((row) => row.id);
    const extras =
      ids.length === 0
        ? []
        : await this.#db
            .select({ serviceId: serviceItems.serviceId, name: serviceItems.nameSnapshot })
            .from(serviceItems)
            .where(and(inArray(serviceItems.serviceId, ids), eq(serviceItems.kind, "extra")));

    return rows.map((row) => ({
      ...row,
      extras: extras.filter((extra) => extra.serviceId === row.id).map((extra) => extra.name),
      performedAt: row.performedAt.toISOString(),
    }));
  }

  async updateStatus(id: number, status: ServiceStatus) {
    const [row] = await this.#db
      .update(services)
      .set({ status })
      .where(eq(services.id, id))
      .returning({ id: services.id, status: services.status });

    return row ?? null;
  }
}
