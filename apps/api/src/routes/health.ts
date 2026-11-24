import type { FastifyInstance } from "fastify";

// Tells anyone (a person, Docker or a monitor) that the API is alive.
export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    return { status: "ok" };
  });
}
