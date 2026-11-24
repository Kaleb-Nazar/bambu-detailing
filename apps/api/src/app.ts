import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import type { Config } from "./config.js";
import type { AppDependencies } from "./container.js";
import { errorHandler } from "./error-handler.js";
import { catalogRoutes } from "./modules/catalog/routes.js";
import { reportRoutes } from "./modules/reports/routes.js";
import { serviceRoutes } from "./modules/services/infrastructure/routes.js";
import { supplyRoutes } from "./modules/supplies/infrastructure/routes.js";
import { healthRoutes } from "./routes/health.js";

// Builds the app without opening a port, so tests can use it directly.
export async function buildApp(config: Config, deps: AppDependencies) {
  const app = Fastify({
    logger: { level: config.LOG_LEVEL },
  });

  // Zod validates requests and responses, and also feeds the OpenAPI docs.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);

  await app.register(fastifySwagger, {
    openapi: {
      info: { title: "Bambu Detailing API", version: "0.1.0" },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(fastifySwaggerUi, { routePrefix: "/docs" });

  await app.register(healthRoutes);
  await app.register(catalogRoutes, { catalog: deps.catalog });
  await app.register(serviceRoutes, {
    registerService: deps.registerService,
    serviceQueries: deps.serviceQueries,
  });
  await app.register(supplyRoutes, {
    registerPurchase: deps.registerPurchase,
    supplyQueries: deps.supplyQueries,
  });
  await app.register(reportRoutes, { reports: deps.reports });

  return app;
}
