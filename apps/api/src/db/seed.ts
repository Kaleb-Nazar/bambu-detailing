import { sql } from "drizzle-orm";
import { loadConfig } from "../config.js";
import { createDb } from "./client.js";
import {
  extraPrices,
  extraServices,
  packagePrices,
  suppliers,
  supplies,
  supplyPurchaseItems,
  supplyPurchases,
  vehicleTypes,
  washPackages,
} from "./schema.js";

// Fake data for local development. It wipes every table and fills them again.

const pesos = (amount: number) => amount * 100;

const config = loadConfig();
const { db, close } = createDb(config.DATABASE_URL);

await db.transaction(async (tx) => {
  await tx.execute(sql`
    TRUNCATE vehicle_types, wash_packages, package_prices, extra_services, extra_prices,
      vehicles, services, service_items, suppliers, supplies, supply_purchases,
      supply_purchase_items
    RESTART IDENTITY CASCADE
  `);

  const [sedan, suv, pickup] = await tx
    .insert(vehicleTypes)
    .values([
      { name: "Sedán", sortOrder: 1 },
      { name: "SUV", sortOrder: 2 },
      { name: "Pick up", sortOrder: 3 },
    ])
    .returning();

  const [express, basic, plus] = await tx
    .insert(washPackages)
    .values([
      {
        name: "Express",
        description: "Lavado exterior rápido.",
        includes: ["Lavado exterior", "Secado"],
        durationMinutes: 30,
      },
      {
        name: "Basic",
        description: "Lavado por dentro y por fuera.",
        includes: ["Lavado exterior", "Secado", "Aspirado", "Limpieza de tablero"],
        durationMinutes: 50,
      },
      {
        name: "Plus",
        description: "Lavado completo con detallado.",
        includes: ["Todo lo de Basic", "Encerado", "Abrillantado de llantas", "Aromatizante"],
        durationMinutes: 90,
      },
    ])
    .returning();

  const [carpets, upholstery] = await tx
    .insert(extraServices)
    .values([
      { name: "Alfombras", description: "Lavado profundo de alfombras." },
      { name: "Vestiduras", description: "Lavado de asientos y vestiduras." },
    ])
    .returning();

  if (!sedan || !suv || !pickup || !express || !basic || !plus || !carpets || !upholstery) {
    throw new Error("Seed failed: catalog rows were not created");
  }

  // Price table: [Sedán, SUV, Pick up] in pesos.
  const packageTable = [
    [express, [120, 150, 180]],
    [basic, [180, 220, 260]],
    [plus, [350, 420, 480]],
  ] as const;

  const extraTable = [
    [carpets, [80, 100, 120]],
    [upholstery, [450, 550, 650]],
  ] as const;

  const types = [sedan, suv, pickup];

  await tx.insert(packagePrices).values(
    packageTable.flatMap(([pkg, prices]) =>
      types.map((type, i) => ({
        packageId: pkg.id,
        vehicleTypeId: type.id,
        priceCents: pesos(prices[i] ?? 0),
      })),
    ),
  );

  await tx.insert(extraPrices).values(
    extraTable.flatMap(([extra, prices]) =>
      types.map((type, i) => ({
        extraId: extra.id,
        vehicleTypeId: type.id,
        priceCents: pesos(prices[i] ?? 0),
      })),
    ),
  );

  const [shampoo, airFreshener, armorAll, microfiber] = await tx
    .insert(supplies)
    .values([
      { name: "Shampoo para autos", defaultUnit: "litro" },
      { name: "Aromatizante", defaultUnit: "pieza" },
      { name: "Armor All", defaultUnit: "botella" },
      { name: "Franela de microfibra", defaultUnit: "pieza" },
    ])
    .returning();

  const [wholesaler] = await tx
    .insert(suppliers)
    .values([
      { name: "Distribuidora de limpieza", phone: "+525500000000" },
      { name: "Tienda de autopartes" },
    ])
    .returning();

  if (!shampoo || !airFreshener || !armorAll || !microfiber || !wholesaler) {
    throw new Error("Seed failed: supply rows were not created");
  }

  const [purchase] = await tx
    .insert(supplyPurchases)
    .values({ supplierId: wholesaler.id, notes: "Compra de ejemplo" })
    .returning();

  if (!purchase) {
    throw new Error("Seed failed: purchase was not created");
  }

  await tx.insert(supplyPurchaseItems).values([
    {
      purchaseId: purchase.id,
      supplyId: shampoo.id,
      quantity: 3.78,
      unit: "litro",
      totalCents: pesos(290),
    },
    {
      purchaseId: purchase.id,
      supplyId: microfiber.id,
      quantity: 12,
      unit: "pieza",
      totalCents: pesos(240),
    },
    {
      purchaseId: purchase.id,
      supplyId: airFreshener.id,
      quantity: 10,
      unit: "pieza",
      totalCents: pesos(150),
    },
  ]);
});

console.log("Seed completed");
await close();
