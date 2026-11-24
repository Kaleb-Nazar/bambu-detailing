import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// Money is always stored in cents (integer) to avoid rounding errors: $150.00 = 15000.

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ---------- Catalog ----------

export const vehicleTypes = pgTable("vehicle_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const washPackages = pgTable("wash_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  includes: text("includes").array().notNull().default([]),
  durationMinutes: integer("duration_minutes").notNull(),
  active: boolean("active").notNull().default(true),
});

export const packagePrices = pgTable(
  "package_prices",
  {
    packageId: integer("package_id")
      .notNull()
      .references(() => washPackages.id),
    vehicleTypeId: integer("vehicle_type_id")
      .notNull()
      .references(() => vehicleTypes.id),
    priceCents: integer("price_cents").notNull(),
  },
  (table) => [primaryKey({ columns: [table.packageId, table.vehicleTypeId] })],
);

export const extraServices = pgTable("extra_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  active: boolean("active").notNull().default(true),
});

export const extraPrices = pgTable(
  "extra_prices",
  {
    extraId: integer("extra_id")
      .notNull()
      .references(() => extraServices.id),
    vehicleTypeId: integer("vehicle_type_id")
      .notNull()
      .references(() => vehicleTypes.id),
    priceCents: integer("price_cents").notNull(),
  },
  (table) => [primaryKey({ columns: [table.extraId, table.vehicleTypeId] })],
);

// ---------- Vehicles and services ----------

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plate: text("plate").notNull().unique(),
  vehicleTypeId: integer("vehicle_type_id")
    .notNull()
    .references(() => vehicleTypes.id),
  createdAt: createdAt(),
});

export const serviceStatus = pgEnum("service_status", [
  "waiting",
  "washing",
  "ready",
  "delivered",
  "cancelled",
]);

export const paymentMethod = pgEnum("payment_method", ["cash", "transfer"]);

export const services = pgTable(
  "services",
  {
    id: serial("id").primaryKey(),
    vehicleId: integer("vehicle_id").references(() => vehicles.id),
    vehicleTypeId: integer("vehicle_type_id")
      .notNull()
      .references(() => vehicleTypes.id),
    packageId: integer("package_id")
      .notNull()
      .references(() => washPackages.id),
    status: serviceStatus("status").notNull().default("waiting"),
    paymentMethod: paymentMethod("payment_method").notNull().default("cash"),
    totalCents: integer("total_cents").notNull(),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (table) => [index("services_performed_at_idx").on(table.performedAt)],
);

export const serviceItemKind = pgEnum("service_item_kind", ["package", "extra"]);

// A copy of each name and price at the moment of the service,
// so a price change tomorrow does not change the reports of yesterday.
export const serviceItems = pgTable("service_items", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  kind: serviceItemKind("kind").notNull(),
  refId: integer("ref_id").notNull(),
  nameSnapshot: text("name_snapshot").notNull(),
  priceCents: integer("price_cents").notNull(),
});

// ---------- Supplies (materials the car wash buys) ----------

// Only the name is required, so a new supplier can be added in seconds
// while registering a purchase, and completed later.
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const supplies = pgTable("supplies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  defaultUnit: text("default_unit").notNull(),
  active: boolean("active").notNull().default(true),
});

export const supplyPurchases = pgTable(
  "supply_purchases",
  {
    id: serial("id").primaryKey(),
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    purchasedOn: date("purchased_on", { mode: "string" }).notNull().defaultNow(),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (table) => [index("supply_purchases_purchased_on_idx").on(table.purchasedOn)],
);

// Quantity, unit and price are free on every purchase because they change
// from store to store (a gallon here, a liter there).
export const supplyPurchaseItems = pgTable(
  "supply_purchase_items",
  {
    id: serial("id").primaryKey(),
    purchaseId: integer("purchase_id")
      .notNull()
      .references(() => supplyPurchases.id, { onDelete: "cascade" }),
    supplyId: integer("supply_id")
      .notNull()
      .references(() => supplies.id),
    quantity: numeric("quantity", { precision: 10, scale: 2, mode: "number" }).notNull(),
    unit: text("unit").notNull(),
    totalCents: integer("total_cents").notNull(),
  },
  (table) => [unique().on(table.purchaseId, table.supplyId)],
);
