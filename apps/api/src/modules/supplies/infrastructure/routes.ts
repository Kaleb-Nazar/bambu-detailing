import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import type { RegisterPurchase } from "../application/register-purchase.js";
import {
  registerPurchaseBody,
  registerPurchaseResponse,
  type SupplyQueries,
  supplierSchema,
  supplySchema,
} from "./schemas.js";

interface Options {
  registerPurchase: RegisterPurchase;
  supplyQueries: SupplyQueries;
}

export const supplyRoutes: FastifyPluginAsyncZod<Options> = async (
  app,
  { registerPurchase, supplyQueries },
) => {
  app.get(
    "/supplies",
    {
      schema: {
        tags: ["supplies"],
        summary: "Materials catalog",
        response: { 200: z.array(supplySchema) },
      },
    },
    async () => supplyQueries.listSupplies(),
  );

  app.get(
    "/suppliers",
    {
      schema: {
        tags: ["supplies"],
        summary: "Suppliers",
        response: { 200: z.array(supplierSchema) },
      },
    },
    async () => supplyQueries.listSuppliers(),
  );

  app.post(
    "/purchases",
    {
      schema: {
        tags: ["supplies"],
        summary: "Register a materials purchase (creates the supplier if it is new)",
        body: registerPurchaseBody,
        response: { 201: registerPurchaseResponse },
      },
    },
    async (request, reply) => {
      const result = await registerPurchase.execute(request.body);
      return reply.code(201).send(result);
    },
  );
};
