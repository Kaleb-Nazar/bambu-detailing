import { Form, type LoaderFunctionArgs, useLoaderData } from "react-router";
import { api } from "../lib/api";
import { formatMoney } from "../lib/money";

// The week comes from the URL (?date=2026-11-24), so a report can be shared as a link.
export async function reportLoader({ request }: LoaderFunctionArgs) {
  const date = new URL(request.url).searchParams.get("date");
  return api.weeklyReport(date);
}

const dayName = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });

export function Report() {
  const report = useLoaderData<typeof reportLoader>();
  const maxIncome = Math.max(1, ...report.days.map((d) => d.incomeCents));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Reporte semanal</h1>
          <p className="text-sm text-stone-500">
            {report.weekStart} al {report.weekEnd}
          </p>
        </div>
        <Form className="flex gap-2">
          <input
            type="date"
            name="date"
            defaultValue={report.weekStart}
            className="rounded-xl border border-stone-300 bg-white p-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-3 text-sm font-semibold text-white"
          >
            Ver
          </button>
        </Form>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Ingreso" value={formatMoney(report.incomeCents)} />
        <Stat label="Servicios" value={String(report.servicesCount)} />
        <Stat label="Ticket promedio" value={formatMoney(report.averageTicketCents)} />
        <Stat label="Gasto en material" value={formatMoney(report.suppliesSpentCents)} />
        <div className="col-span-2 rounded-2xl bg-brand-900 p-4 text-white">
          <p className="text-xs text-brand-100">Ingreso menos material</p>
          <p className="mt-1 text-3xl font-bold">{formatMoney(report.netCents)}</p>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-sm font-semibold text-stone-700">Ingreso por día</h2>
        <ul className="mt-4 space-y-2">
          {report.days.map((day) => (
            <li
              key={day.date}
              className="grid grid-cols-[4rem_1fr_6rem] items-center gap-2 text-sm"
            >
              <span className="capitalize text-stone-600">{dayName(day.date)}</span>
              <span className="h-3 rounded-full bg-stone-100">
                <span
                  className="block h-3 rounded-full bg-brand-600"
                  style={{ width: `${(day.incomeCents / maxIncome) * 100}%` }}
                />
              </span>
              <span className="text-right font-semibold">{formatMoney(day.incomeCents)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
