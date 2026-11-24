import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { type CatalogQueries, catalogSchema } from "./schemas.js";

export const catalogRoutes: FastifyPluginAsyncZod<{ catalog: CatalogQueries }> = async (
  app,
  { catalog },
) => {
  app.get(
    "/catalog",
    {
      schema: {
        tags: ["catalog"],
        summary: "Vehicle types, packages and extras with their prices",
        response: { 200: catalogSchema },
      },
    },
    async () => catalog.getCatalog(),
  );
};
