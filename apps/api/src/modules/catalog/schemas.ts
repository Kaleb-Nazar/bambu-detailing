import { z } from "zod";

const price = z.object({
  vehicleTypeId: z.number().int(),
  priceCents: z.number().int(),
});

export const catalogSchema = z.object({
  vehicleTypes: z.array(z.object({ id: z.number().int(), name: z.string() })),
  packages: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      description: z.string(),
      includes: z.array(z.string()),
      durationMinutes: z.number().int(),
      prices: z.array(price),
    }),
  ),
  extras: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      description: z.string(),
      prices: z.array(price),
    }),
  ),
});

export type Catalog = z.infer<typeof catalogSchema>;

// Read-only query, so it skips the use case layer (light CQRS).
export interface CatalogQueries {
  getCatalog(): Promise<Catalog>;
}
