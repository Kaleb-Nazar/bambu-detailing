import { z } from "zod";

export const weeklyReportQuery = z.object({
  // Any day of the week works; the report starts on that Monday. Empty = this week.
  date: z.iso.date().optional(),
});

export const weeklyReportSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  servicesCount: z.number().int(),
  incomeCents: z.number().int(),
  averageTicketCents: z.number().int(),
  suppliesSpentCents: z.number().int(),
  netCents: z.number().int(),
  days: z.array(
    z.object({
      date: z.string(),
      servicesCount: z.number().int(),
      incomeCents: z.number().int(),
    }),
  ),
});

export type WeeklyReport = z.infer<typeof weeklyReportSchema>;

export interface ReportQueries {
  weekly(date: string | null): Promise<WeeklyReport>;
}
