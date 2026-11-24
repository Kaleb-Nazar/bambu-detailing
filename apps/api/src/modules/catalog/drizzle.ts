import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import {
  extraPrices,
  extraServices,
  packagePrices,
  vehicleTypes,
  washPackages,
} from "../../db/schema.js";
import type { CatalogReader, PricedItem } from "../services/application/ports.js";
import type { Catalog, CatalogQueries } from "./schemas.js";

// One class, two jobs: the catalog page and the prices the services use case needs.
export class DrizzleCatalog implements CatalogQueries, CatalogReader {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  async getCatalog(): Promise<Catalog> {
    const db = this.#db;
    const [types, packages, pkgPrices, extras, exPrices] = await Promise.all([
      db
        .select({ id: vehicleTypes.id, name: vehicleTypes.name })
        .from(vehicleTypes)
        .orderBy(asc(vehicleTypes.sortOrder)),
      db
        .select()
        .from(washPackages)
        .where(eq(washPackages.active, true))
        .orderBy(asc(washPackages.id)),
      db.select().from(packagePrices),
      db
        .select()
        .from(extraServices)
        .where(eq(extraServices.active, true))
        .orderBy(asc(extraServices.id)),
      db.select().from(extraPrices),
    ]);

    return {
      vehicleTypes: types,
      packages: packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        includes: pkg.includes,
        durationMinutes: pkg.durationMinutes,
        prices: pkgPrices
          .filter((p) => p.packageId === pkg.id)
          .map(({ vehicleTypeId, priceCents }) => ({ vehicleTypeId, priceCents })),
      })),
      extras: extras.map((extra) => ({
        id: extra.id,
        name: extra.name,
        description: extra.description,
        prices: exPrices
          .filter((p) => p.extraId === extra.id)
          .map(({ vehicleTypeId, priceCents }) => ({ vehicleTypeId, priceCents })),
      })),
    };
  }

  async findPackagePrice(packageId: number, vehicleTypeId: number): Promise<PricedItem | null> {
    const [row] = await this.#db
      .select({
        id: washPackages.id,
        name: washPackages.name,
        priceCents: packagePrices.priceCents,
      })
      .from(washPackages)
      .innerJoin(packagePrices, eq(packagePrices.packageId, washPackages.id))
      .where(
        and(
          eq(washPackages.id, packageId),
          eq(washPackages.active, true),
          eq(packagePrices.vehicleTypeId, vehicleTypeId),
        ),
      );

    return row ?? null;
  }

  async findExtraPrices(extraIds: number[], vehicleTypeId: number): Promise<PricedItem[]> {
    if (extraIds.length === 0) {
      return [];
    }

    return this.#db
      .select({
        id: extraServices.id,
        name: extraServices.name,
        priceCents: extraPrices.priceCents,
      })
      .from(extraServices)
      .innerJoin(extraPrices, eq(extraPrices.extraId, extraServices.id))
      .where(
        and(
          inArray(extraServices.id, extraIds),
          eq(extraServices.active, true),
          eq(extraPrices.vehicleTypeId, vehicleTypeId),
        ),
      )
      .orderBy(asc(extraServices.id));
  }
}
