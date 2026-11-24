import { beforeEach, describe, expect, it } from "vitest";
import { DomainError } from "../../../shared/domain-error.js";
import type {
  NewPurchase,
  PurchaseRepository,
  Supplier,
  SupplierRepository,
  SupplyRepository,
} from "./ports.js";
import { RegisterPurchase } from "./register-purchase.js";

const SHAMPOO = 1;
const MICROFIBER = 2;

const supplies: SupplyRepository = {
  async findByIds(ids) {
    const rows = [
      { id: SHAMPOO, name: "Shampoo para autos", defaultUnit: "litro" },
      { id: MICROFIBER, name: "Franela de microfibra", defaultUnit: "pieza" },
    ];
    return rows.filter((supply) => ids.includes(supply.id));
  },
};

class InMemorySuppliers implements SupplierRepository {
  rows: Supplier[] = [{ id: 1, name: "Distribuidora de limpieza" }];

  async findByName(name: string) {
    return this.rows.find((s) => s.name.toLowerCase() === name.toLowerCase()) ?? null;
  }

  async create(supplier: { name: string }) {
    const row = { id: this.rows.length + 1, ...supplier };
    this.rows.push(row);
    return row;
  }
}

class InMemoryPurchases implements PurchaseRepository {
  rows: NewPurchase[] = [];

  async create(purchase: NewPurchase) {
    this.rows.push(purchase);
    return { id: this.rows.length };
  }
}

describe("RegisterPurchase", () => {
  let suppliers: InMemorySuppliers;
  let purchases: InMemoryPurchases;
  let registerPurchase: RegisterPurchase;

  beforeEach(() => {
    suppliers = new InMemorySuppliers();
    purchases = new InMemoryPurchases();
    registerPurchase = new RegisterPurchase({ suppliers, supplies, purchases });
  });

  it("uses an existing supplier, ignoring upper and lower case", async () => {
    const result = await registerPurchase.execute({
      supplierName: "  distribuidora DE limpieza ",
      items: [{ supplyId: SHAMPOO, quantity: 3.78, totalCents: 29000 }],
    });

    expect(result).toEqual({ id: 1, supplierId: 1, supplierCreated: false, totalCents: 29000 });
    expect(suppliers.rows).toHaveLength(1);
  });

  it("creates the supplier with only its name when it is new", async () => {
    const result = await registerPurchase.execute({
      supplierName: "Tienda nueva",
      items: [{ supplyId: SHAMPOO, quantity: 1, totalCents: 9000 }],
    });

    expect(result.supplierCreated).toBe(true);
    expect(suppliers.rows.at(-1)).toEqual({ id: 2, name: "Tienda nueva" });
  });

  it("keeps the unit typed by the user, or uses the default one", async () => {
    await registerPurchase.execute({
      supplierName: "Distribuidora de limpieza",
      purchasedOn: "2026-11-20",
      items: [
        { supplyId: SHAMPOO, quantity: 1, unit: "galón", totalCents: 29000 },
        { supplyId: MICROFIBER, quantity: 12, totalCents: 24000 },
      ],
    });

    expect(purchases.rows[0]).toEqual({
      supplierId: 1,
      purchasedOn: "2026-11-20",
      notes: null,
      items: [
        { supplyId: SHAMPOO, quantity: 1, unit: "galón", totalCents: 29000 },
        { supplyId: MICROFIBER, quantity: 12, unit: "pieza", totalCents: 24000 },
      ],
    });
  });

  it("adds up the total of the purchase", async () => {
    const result = await registerPurchase.execute({
      supplierName: "Distribuidora de limpieza",
      items: [
        { supplyId: SHAMPOO, quantity: 1, totalCents: 29000 },
        { supplyId: MICROFIBER, quantity: 12, totalCents: 24000 },
      ],
    });

    expect(result.totalCents).toBe(53000);
  });

  it.each([
    [
      "an empty supplier name",
      { supplierName: " ", items: [{ supplyId: SHAMPOO, quantity: 1, totalCents: 100 }] },
    ],
    ["no items", { supplierName: "X", items: [] }],
    [
      "a quantity of 0",
      { supplierName: "X", items: [{ supplyId: SHAMPOO, quantity: 0, totalCents: 100 }] },
    ],
    [
      "a price of 0",
      { supplierName: "X", items: [{ supplyId: SHAMPOO, quantity: 1, totalCents: 0 }] },
    ],
    [
      "an unknown supply",
      { supplierName: "X", items: [{ supplyId: 999, quantity: 1, totalCents: 100 }] },
    ],
    [
      "the same supply twice",
      {
        supplierName: "X",
        items: [
          { supplyId: SHAMPOO, quantity: 1, totalCents: 100 },
          { supplyId: SHAMPOO, quantity: 2, totalCents: 200 },
        ],
      },
    ],
  ])("fails with %s and does not create the supplier", async (_case, input) => {
    await expect(registerPurchase.execute(input)).rejects.toThrow(DomainError);
    expect(suppliers.rows).toHaveLength(1);
    expect(purchases.rows).toHaveLength(0);
  });
});
