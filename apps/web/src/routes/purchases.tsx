import { useState } from "react";
import {
  type ActionFunctionArgs,
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { ApiError, api } from "../lib/api";
import { formatMoney, pesosToCents } from "../lib/money";

export async function purchasesLoader() {
  const [supplies, suppliers] = await Promise.all([api.supplies(), api.suppliers()]);
  return { supplies, suppliers };
}

export async function purchasesAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const supplyIds = form.getAll("supplyId").map(Number);
  const quantities = form.getAll("quantity").map(String);
  const units = form.getAll("unit").map(String);
  const prices = form.getAll("price").map(String);

  try {
    const result = await api.registerPurchase({
      supplierName: String(form.get("supplierName") ?? ""),
      purchasedOn: String(form.get("purchasedOn") ?? "") || null,
      notes: String(form.get("notes") ?? "") || null,
      items: supplyIds.map((supplyId, i) => ({
        supplyId,
        quantity: Number.parseFloat(quantities[i] ?? ""),
        unit: units[i] || null,
        totalCents: pesosToCents(prices[i] ?? "") ?? 0,
      })),
    });
    return { ok: true as const, ...result };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false as const, error: error.message };
    }
    throw error;
  }
}

const input = "w-full rounded-xl border border-stone-300 bg-white p-3";

export function Purchases() {
  const { supplies, suppliers } = useLoaderData<typeof purchasesLoader>();
  const result = useActionData<typeof purchasesAction>();
  const navigation = useNavigation();
  // Each row has a stable key so React keeps what was typed when a row is removed.
  const [rows, setRows] = useState([0]);
  const [nextKey, setNextKey] = useState(1);

  const addRow = () => {
    setRows((r) => [...r, nextKey]);
    setNextKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Compra de material</h1>

      {result?.ok === false && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{result.error}</p>
      )}
      {result?.ok && (
        <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
          Compra guardada por {formatMoney(result.totalCents)}.
          {result.supplierCreated && " Se dio de alta un proveedor nuevo."}
        </p>
      )}

      {/* key changes after each save, so the form starts empty again */}
      <Form method="post" className="space-y-4" key={result?.ok ? result.id : "form"}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">Proveedor</span>
          <input
            name="supplierName"
            list="suppliers"
            required
            placeholder="Escribe o elige uno; si es nuevo se crea solo"
            className={input}
          />
          <datalist id="suppliers">
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.name} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">
            Fecha (vacío = hoy)
          </span>
          <input type="date" name="purchasedOn" className={input} />
        </label>

        <div className="space-y-3">
          <span className="block text-sm font-semibold text-stone-700">Qué compraste</span>
          {rows.map((key) => (
            <fieldset
              key={key}
              className="grid grid-cols-6 gap-2 rounded-2xl bg-white p-3 ring-1 ring-stone-200"
            >
              <select name="supplyId" required className={`${input} col-span-6`}>
                {supplies.map((supply) => (
                  <option key={supply.id} value={supply.id}>
                    {supply.name} ({supply.defaultUnit})
                  </option>
                ))}
              </select>
              <input
                name="quantity"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Cantidad"
                className={`${input} col-span-2`}
              />
              <input name="unit" placeholder="Unidad" className={`${input} col-span-2`} />
              <input
                name="price"
                inputMode="decimal"
                required
                placeholder="$ total"
                className={`${input} col-span-2`}
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows((r) => r.filter((k) => k !== key))}
                  className="col-span-6 text-right text-sm text-red-700"
                >
                  Quitar
                </button>
              )}
            </fieldset>
          ))}
          <button type="button" onClick={addRow} className="text-sm font-semibold text-brand-700">
            + Agregar otro material
          </button>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">Notas (opcional)</span>
          <textarea name="notes" rows={2} className={input} />
        </label>

        <button
          type="submit"
          disabled={navigation.state === "submitting"}
          className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white disabled:opacity-50"
        >
          {navigation.state === "submitting" ? "Guardando…" : "Guardar compra"}
        </button>
      </Form>
    </div>
  );
}
