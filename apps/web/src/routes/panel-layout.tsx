import { NavLink, Outlet, useNavigation } from "react-router";

const links = [
  { to: "/panel", label: "Hoy", end: true },
  { to: "/panel/registrar", label: "Registrar", end: false },
  { to: "/panel/compras", label: "Compras", end: false },
  { to: "/panel/reporte", label: "Reporte", end: false },
];

// Mobile-first: a top bar with the title and a bottom tab bar, like a phone app.
export function PanelLayout() {
  const navigation = useNavigation();

  return (
    <div className="min-h-dvh pb-20">
      <header className="sticky top-0 z-10 bg-brand-900 px-4 py-3 text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="font-bold">Bambu · Panel</span>
          {navigation.state !== "idle" && <span className="text-xs text-brand-100">Cargando…</span>}
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white">
        <ul className="mx-auto grid max-w-2xl grid-cols-4">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `block py-4 text-center text-sm font-semibold ${
                    isActive ? "text-brand-700" : "text-stone-500"
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
