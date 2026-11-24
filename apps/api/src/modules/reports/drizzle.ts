import { sql } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import { BUSINESS_TIME_ZONE } from "../../shared/time.js";
import type { ReportQueries, WeeklyReport } from "./schemas.js";

// Reports only read, so they use plain SQL: easier to follow than many joins in code.
export class DrizzleReportQueries implements ReportQueries {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  async weekly(date: string | null): Promise<WeeklyReport> {
    const tz = BUSINESS_TIME_ZONE;

    // One row per day, Monday to Sunday. Cancelled services do not count.
    const days = await this.#db.execute<{
      date: string;
      services_count: number;
      income_cents: number;
    }>(sql`
      WITH week AS (
        SELECT date_trunc('week', COALESCE(${date}::date, (now() AT TIME ZONE ${tz})::date))::date AS start
      ),
      days AS (
        SELECT (week.start + offset_days)::date AS day
        FROM week, generate_series(0, 6) AS offset_days
      )
      SELECT
        days.day::text AS date,
        count(services.id)::int AS services_count,
        coalesce(sum(services.total_cents), 0)::int AS income_cents
      FROM days
      LEFT JOIN services
        ON (services.performed_at AT TIME ZONE ${tz})::date = days.day
        AND services.status <> 'cancelled'
      GROUP BY days.day
      ORDER BY days.day
    `);

    const weekStart = days[0]?.date ?? "";
    const weekEnd = days.at(-1)?.date ?? "";

    const [spent] = await this.#db.execute<{ total: number }>(sql`
      SELECT coalesce(sum(items.total_cents), 0)::int AS total
      FROM supply_purchase_items AS items
      JOIN supply_purchases AS purchases ON purchases.id = items.purchase_id
      WHERE purchases.purchased_on BETWEEN ${weekStart}::date AND ${weekEnd}::date
    `);

    const servicesCount = days.reduce((sum, day) => sum + day.services_count, 0);
    const incomeCents = days.reduce((sum, day) => sum + day.income_cents, 0);
    const suppliesSpentCents = spent?.total ?? 0;

    return {
      weekStart,
      weekEnd,
      servicesCount,
      incomeCents,
      averageTicketCents: servicesCount === 0 ? 0 : Math.round(incomeCents / servicesCount),
      suppliesSpentCents,
      netCents: incomeCents - suppliesSpentCents,
      days: days.map((day) => ({
        date: day.date,
        servicesCount: day.services_count,
        incomeCents: day.income_cents,
      })),
    };
  }
}
