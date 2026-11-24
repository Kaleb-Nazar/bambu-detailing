import Fastify from "fastify";
import type { Config } from "./config.js";
import { healthRoutes } from "./routes/health.js";

// Builds the app without opening a port, so tests can use it directly.
export function buildApp(config: Config) {
  const app = Fastify({
    logger: { level: config.LOG_LEVEL },
  });

  app.register(healthRoutes);

  return app;
}
