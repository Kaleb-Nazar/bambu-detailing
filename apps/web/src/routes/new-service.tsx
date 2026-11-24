import { useState } from "react";
import {
  type ActionFunctionArgs,
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { ApiError, api, type PaymentMethod } from "../lib/api";
import { formatMoney } from "../lib/money";

export async function newServiceLoader() {
  return api.catalog();
}

// Like a Laravel controller store(): read the form, call the API, redirect.
export async function newServiceAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();

  try {
    await api.registerService({
      plate: String(form.get("plate") ?? "") || null,
      vehicleTypeId: Number(form.get("vehicleTypeId")),
      packageId: Number(form.get("packageId")),
      extraIds: form.getAll("extraIds").map(Number),
      paymentMethod: form.get("paymentMethod") as PaymentMethod,
      notes: String(form.get("notes") ?? "") || null,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    throw error;
  }

  return redirect("/panel");
}

export function NewService() {
  const catalog = useLoaderData<typeof newServiceLoader>();
  const result = useActionData<typeof newServiceAction>();
  const navigation = useNavigation();

  const [typeId, setTypeId] = useState(catalog.vehicleTypes[0]?.id ?? 0);
  const [packageId, setPackageId] = useState(catalog.packages[0]?.id ?? 0);
  const [extraIds, setExtraIds] = useState<number[]>([]);

  // Only a preview: the API calculates the real total with its own prices.
  const priceOf = (prices: Array<{ vehicleTypeId: number; priceCents: number }>) =>
    prices.find((p) => p.vehicleTypeId === typeId)?.priceCents ?? 0;
  const pkg = catalog.packages.find((p) => p.id === packageId);
  const total =
    (pkg ? priceOf(pkg.prices) : 0) +
    catalog.extras
      .filter((e) => extraIds.includes(e.id))
      .reduce((s, e) => s + priceOf(e.prices), 0);

  const toggleExtra = (id: number) =>
    setExtraIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <Form method="post" className="space-y-6">
      <h1 className="text-xl font-bold">Registrar servicio</h1>

      {result?.error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{result.error}</p>
      )}

      <Field label="Placa (opcional)">
        <input
          name="plate"
          autoCapitalize="characters"
          placeholder="ABC-123"
          className="w-full rounded-xl border border-stone-300 p-3 uppercase"
        />
      </Field>

      <Field label="Tipo de vehículo">
        <Choices
          name="vehicleTypeId"
          options={catalog.vehicleTypes.map((t) => ({ value: t.id, label: t.name }))}
          value={typeId}
          onChange={setTypeId}
        />
      </Field>

      <Field label="Paquete">
        <Choices
          name="packageId"
          options={catalog.packages.map((p) => ({
            value: p.id,
            label: `${p.name} · ${formatMoney(priceOf(p.prices))}`,
          }))}
          value={packageId}
          onChange={setPackageId}
        />
      </Field>

      <Field label="Extras">
        <div className="grid grid-cols-2 gap-2">
          {catalog.extras.map((extra) => (
            <label
              key={extra.id}
              className="flex items-center gap-2 rounded-xl border border-stone-300 p-3 has-checked:border-brand-600 has-checked:bg-brand-50"
            >
              <input
                type="checkbox"
                name="extraIds"
                value={extra.id}
                checked={extraIds.includes(extra.id)}
                onChange={() => toggleExtra(extra.id)}
              />
              <span className="text-sm">
                {extra.name} · {formatMoney(priceOf(extra.prices))}
              </span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Pago">
        <select
          name="paymentMethod"
          className="w-full rounded-xl border border-stone-300 bg-white p-3"
        >
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
        </select>
      </Field>

      <Field label="Notas (opcional)">
        <textarea name="notes" rows={2} className="w-full rounded-xl border border-stone-300 p-3" />
      </Field>

      <div className="sticky bottom-20 flex items-center justify-between rounded-2xl bg-brand-900 p-4 text-white">
        <span>
          Total <strong className="text-xl">{formatMoney(total)}</strong>
        </span>
        <button
          type="submit"
          disabled={navigation.state === "submitting"}
          className="rounded-xl bg-white px-5 py-3 font-semibold text-brand-900 disabled:opacity-50"
        >
          {navigation.state === "submitting" ? "Guardando…" : "Registrar"}
        </button>
      </div>
    </Form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-stone-700">{label}</p>
      {children}
    </div>
  );
}

function Choices({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: Array<{ value: number; label: string }>;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="cursor-pointer rounded-xl border border-stone-300 px-4 py-3 text-sm has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:font-semibold"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
