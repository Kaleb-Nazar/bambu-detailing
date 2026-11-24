import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import type { RegisterService } from "../application/register-service.js";
import {
  registerServiceBody,
  registerServiceResponse,
  type ServiceQueries,
  todayServiceSchema,
  updateStatusBody,
  updateStatusParams,
} from "./schemas.js";

interface Options {
  registerService: RegisterService;
  serviceQueries: ServiceQueries;
}

// Like a Laravel controller: read the request, call the use case, return the result.
export const serviceRoutes: FastifyPluginAsyncZod<Options> = async (
  app,
  { registerService, serviceQueries },
) => {
  app.post(
    "/services",
    {
      schema: {
        tags: ["services"],
        summary: "Register a car wash service",
        body: registerServiceBody,
        response: { 201: registerServiceResponse },
      },
    },
    async (request, reply) => {
      const result = await registerService.execute(request.body);
      return reply.code(201).send(result);
    },
  );

  app.get(
    "/services/today",
    {
      schema: {
        tags: ["services"],
        summary: "Services registered today",
        response: { 200: z.array(todayServiceSchema) },
      },
    },
    async () => serviceQueries.listToday(),
  );

  app.patch(
    "/services/:id/status",
    {
      schema: {
        tags: ["services"],
        summary: "Change the status of a service",
        params: updateStatusParams,
        body: updateStatusBody,
        response: {
          200: z.object({ id: z.number().int(), status: updateStatusBody.shape.status }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const updated = await serviceQueries.updateStatus(request.params.id, request.body.status);
      if (!updated) {
        return reply.code(404).send({ message: "Service not found" });
      }
      return updated;
    },
  );
};
