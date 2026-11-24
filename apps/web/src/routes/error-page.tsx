import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { ApiError } from "../lib/api";

export function ErrorPage() {
  const error = useRouteError();

  let message = "Algo salió mal. Revisa que la API esté encendida.";
  if (isRouteErrorResponse(error) && error.status === 404) {
    message = "Esta página no existe.";
  } else if (error instanceof ApiError) {
    message = error.message;
  }

  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <h1 className="text-2xl font-bold">Ups</h1>
      <p className="mt-2 text-stone-600">{message}</p>
      <Link to="/" className="mt-6 inline-block text-brand-700 underline">
        Volver al inicio
      </Link>
    </main>
  );
}
