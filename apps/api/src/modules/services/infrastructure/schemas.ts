import { z } from "zod";
import type { PaymentMethod } from "../application/ports.js";

export const serviceStatuses = ["waiting", "washing", "ready", "delivered", "cancelled"] as const;
export type ServiceStatus = (typeof serviceStatuses)[number];

const paymentMethods = ["cash", "transfer"] as const satisfies readonly PaymentMethod[];

const id = z.number().int().positive();

// Like a Laravel FormRequest: shape and types of the body. Business rules live in the use case.
export const registerServiceBody = z.object({
  plate: z.string().max(20).nullish(),
  vehicleTypeId: id,
  packageId: id,
  extraIds: z.array(id).max(10).optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  notes: z.string().max(500).nullish(),
});

export const registerServiceResponse = z.object({
  id,
  vehicleId: id.nullable(),
  totalCents: z.number().int(),
  items: z.array(
    z.object({
      kind: z.enum(["package", "extra"]),
      refId: id,
      nameSnapshot: z.string(),
      priceCents: z.number().int(),
    }),
  ),
});

export const todayServiceSchema = z.object({
  id,
  plate: z.string().nullable(),
  vehicleType: z.string(),
  packageName: z.string(),
  extras: z.array(z.string()),
  status: z.enum(serviceStatuses),
  paymentMethod: z.enum(paymentMethods),
  totalCents: z.number().int(),
  performedAt: z.string(),
});

export type TodayService = z.infer<typeof todayServiceSchema>;

export const updateStatusParams = z.object({ id: z.coerce.number().int().positive() });
export const updateStatusBody = z.object({ status: z.enum(serviceStatuses) });

// Read side of the module (light CQRS): simple queries without a use case.
export interface ServiceQueries {
  listToday(): Promise<TodayService[]>;
  updateStatus(
    id: number,
    status: ServiceStatus,
  ): Promise<{ id: number; status: ServiceStatus } | null>;
}
