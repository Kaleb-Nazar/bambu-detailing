import { z } from "zod";

const id = z.number().int().positive();

export const supplySchema = z.object({ id, name: z.string(), defaultUnit: z.string() });

export const supplierSchema = z.object({
  id,
  name: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
});

export type SupplyRow = z.infer<typeof supplySchema>;
export type SupplierRow = z.infer<typeof supplierSchema>;

export const registerPurchaseBody = z.object({
  supplierName: z.string().min(1).max(100),
  purchasedOn: z.iso.date().nullish(),
  notes: z.string().max(500).nullish(),
  items: z
    .array(
      z.object({
        supplyId: id,
        quantity: z.number().positive(),
        unit: z.string().max(30).nullish(),
        totalCents: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(50),
});

export const registerPurchaseResponse = z.object({
  id,
  supplierId: id,
  supplierCreated: z.boolean(),
  totalCents: z.number().int(),
});

export interface SupplyQueries {
  listSupplies(): Promise<SupplyRow[]>;
  listSuppliers(): Promise<SupplierRow[]>;
}
