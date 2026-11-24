import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { type ReportQueries, weeklyReportQuery, weeklyReportSchema } from "./schemas.js";

export const reportRoutes: FastifyPluginAsyncZod<{ reports: ReportQueries }> = async (
  app,
  { reports },
) => {
  app.get(
    "/reports/weekly",
    {
      schema: {
        tags: ["reports"],
        summary: "Income, services and material spending of a week (Monday to Sunday)",
        querystring: weeklyReportQuery,
        response: { 200: weeklyReportSchema },
      },
    },
    async (request) => reports.weekly(request.query.date ?? null),
  );
};
