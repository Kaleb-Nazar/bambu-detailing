import { Link, useLoaderData } from "react-router";
import { api } from "../lib/api";
import { formatMoney } from "../lib/money";

export async function landingLoader() {
  return api.catalog();
}

export function Landing() {
  const catalog = useLoaderData<typeof landingLoader>();

  const priceFor = (
    prices: Array<{ vehicleTypeId: number; priceCents: number }>,
    typeId: number,
  ) => {
    const price = prices.find((p) => p.vehicleTypeId === typeId);
    return price ? formatMoney(price.priceCents) : "—";
  };

  return (
    <div>
      <header className="bg-brand-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">
            Bambu Detailing
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Tu auto limpio, sin complicarte.</h1>
          <p className="mt-4 max-w-xl text-lg text-brand-100">
            Lavado y detallado para sedán, SUV y pick up. Llega cuando quieras: lunes a sábado de
            8:00 a 20:00 y domingo de 8:00 a 17:00.
          </p>
          <a
            href="#precios"
            className="mt-8 inline-block rounded-full bg-white px-6 py-3 font-semibold text-brand-900"
          >
            Ver precios
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <section id="precios">
          <h2 className="text-2xl font-bold">Paquetes</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {catalog.packages.map((pkg) => (
              <article
                key={pkg.id}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200"
              >
                <h3 className="text-xl font-bold text-brand-700">{pkg.name}</h3>
                <p className="mt-1 text-sm text-stone-600">{pkg.description}</p>
                <p className="mt-1 text-xs text-stone-500">Aprox. {pkg.durationMinutes} min</p>
                <ul className="mt-4 space-y-1 text-sm">
                  {pkg.includes.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
                <dl className="mt-4 space-y-1 border-t border-stone-100 pt-4 text-sm">
                  {catalog.vehicleTypes.map((type) => (
                    <div key={type.id} className="flex justify-between">
                      <dt className="text-stone-600">{type.name}</dt>
                      <dd className="font-semibold">{priceFor(pkg.prices, type.id)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Extras</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-stone-600">
                <tr>
                  <th className="p-3">Extra</th>
                  {catalog.vehicleTypes.map((type) => (
                    <th key={type.id} className="p-3 text-right">
                      {type.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catalog.extras.map((extra) => (
                  <tr key={extra.id} className="border-t border-stone-100">
                    <td className="p-3">
                      <p className="font-semibold">{extra.name}</p>
                      <p className="text-stone-500">{extra.description}</p>
                    </td>
                    {catalog.vehicleTypes.map((type) => (
                      <td key={type.id} className="p-3 text-right font-semibold">
                        {priceFor(extra.prices, type.id)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        Bambu Detailing ·{" "}
        <Link to="/panel" className="underline">
          Panel
        </Link>
      </footer>
    </div>
  );
}
