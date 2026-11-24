import { type ActionFunctionArgs, Link, useFetcher, useLoaderData } from "react-router";
import { api, type ServiceStatus, type TodayService } from "../lib/api";
import { formatMoney } from "../lib/money";

const statusLabel: Record<ServiceStatus, string> = {
  waiting: "En espera",
  washing: "Lavando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const statusColor: Record<ServiceStatus, string> = {
  waiting: "bg-amber-100 text-amber-800",
  washing: "bg-sky-100 text-sky-800",
  ready: "bg-brand-100 text-brand-900",
  delivered: "bg-stone-200 text-stone-700",
  cancelled: "bg-red-100 text-red-800",
};

// One tap moves the car to the next step.
const nextStatus: Partial<Record<ServiceStatus, ServiceStatus>> = {
  waiting: "washing",
  washing: "ready",
  ready: "delivered",
};

export async function todayLoader() {
  return api.todayServices();
}

export async function todayAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  await api.updateStatus(Number(form.get("id")), form.get("status") as ServiceStatus);
  return null;
}

export function Today() {
  const services = useLoaderData<typeof todayLoader>();
  const active = services.filter((s) => s.status !== "cancelled");
  const income = active.reduce((sum, s) => sum + s.totalCents, 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Servicios hoy" value={String(active.length)} />
        <Stat label="Ingreso hoy" value={formatMoney(income)} />
      </div>

      {services.length === 0 ? (
        <div className="mt-8 text-center text-stone-500">
          <p>Todavía no hay autos hoy.</p>
          <Link to="/panel/registrar" className="mt-2 inline-block font-semibold text-brand-700">
            Registrar el primero
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ServiceCard({ service }: { service: TodayService }) {
  const fetcher = useFetcher();
  // Show the new status right away, before the API answers (optimistic UI).
  const status = (fetcher.formData?.get("status") as ServiceStatus | null) ?? service.status;
  const next = nextStatus[status];
  const time = new Date(service.performedAt).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold">{service.plate ?? "Sin placa"}</p>
          <p className="text-sm text-stone-600">
            {service.vehicleType} · {service.packageName}
            {service.extras.length > 0 && ` + ${service.extras.join(", ")}`}
          </p>
          <p className="text-xs text-stone-500">
            {time} · {formatMoney(service.totalCents)} ·{" "}
            {service.paymentMethod === "cash" ? "Efectivo" : "Transferencia"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[status]}`}>
          {statusLabel[status]}
        </span>
      </div>

      {(next || status === "waiting") && (
        <fetcher.Form method="post" className="mt-3 flex gap-2">
          <input type="hidden" name="id" value={service.id} />
          {next && (
            <button
              type="submit"
              name="status"
              value={next}
              className="flex-1 rounded-xl bg-brand-600 py-3 font-semibold text-white"
            >
              Pasar a "{statusLabel[next]}"
            </button>
          )}
          {status === "waiting" && (
            <button
              type="submit"
              name="status"
              value="cancelled"
              className="rounded-xl px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200"
            >
              Cancelar
            </button>
          )}
        </fetcher.Form>
      )}
    </li>
  );
}
