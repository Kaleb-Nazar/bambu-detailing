import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../../../db/client.js";
import { suppliers, supplies, supplyPurchaseItems, supplyPurchases } from "../../../db/schema.js";
import { BUSINESS_TIME_ZONE } from "../../../shared/time.js";
import type {
  NewPurchase,
  PurchaseRepository,
  Supplier,
  SupplierRepository,
  Supply,
  SupplyRepository,
} from "../application/ports.js";
import type { SupplierRow, SupplyQueries, SupplyRow } from "./schemas.js";

export class DrizzleSupplierRepository implements SupplierRepository {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  async findByName(name: string): Promise<Supplier | null> {
    const [row] = await this.#db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(sql`lower(${suppliers.name}) = lower(${name})`);

    return row ?? null;
  }

  async create(supplier: { name: string }): Promise<Supplier> {
    const [row] = await this.#db
      .insert(suppliers)
      .values(supplier)
      .returning({ id: suppliers.id, name: suppliers.name });

    if (!row) {
      throw new Error("Supplier was not created");
    }
    return row;
  }
}

export class DrizzleSupplyRepository implements SupplyRepository {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  async findByIds(ids: number[]): Promise<Supply[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.#db
      .select({ id: supplies.id, name: supplies.name, defaultUnit: supplies.defaultUnit })
      .from(supplies)
      .where(and(inArray(supplies.id, ids), eq(supplies.active, true)));
  }
}

export class DrizzlePurchaseRepository implements PurchaseRepository {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  async create({ items, purchasedOn, ...purchase }: NewPurchase): Promise<{ id: number }> {
    return this.#db.transaction(async (tx) => {
      const [row] = await tx
        .insert(supplyPurchases)
        .values({
          ...purchase,
          // Without a date, "today" in Mexico (the database clock runs in UTC).
          purchasedOn: purchasedOn ?? sql`(now() AT TIME ZONE ${BUSINESS_TIME_ZONE})::date`,
        })
        .returning({ id: supplyPurchases.id });

      if (!row) {
        throw new Error("Purchase was not created");
      }

      await tx
        .insert(supplyPurchaseItems)
        .values(items.map((item) => ({ ...item, purchaseId: row.id })));
      return row;
    });
  }
}

export class DrizzleSupplyQueries implements SupplyQueries {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  async listSupplies(): Promise<SupplyRow[]> {
    return this.#db
      .select({ id: supplies.id, name: supplies.name, defaultUnit: supplies.defaultUnit })
      .from(supplies)
      .where(eq(supplies.active, true))
      .orderBy(asc(supplies.name));
  }

  async listSuppliers(): Promise<SupplierRow[]> {
    return this.#db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        phone: suppliers.phone,
        address: suppliers.address,
        notes: suppliers.notes,
      })
      .from(suppliers)
      .where(eq(suppliers.active, true))
      .orderBy(asc(suppliers.name));
  }
}
