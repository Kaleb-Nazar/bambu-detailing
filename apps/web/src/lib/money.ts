const formatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

// The API speaks in cents; people read pesos. 15000 -> "$150.00".
export function formatMoney(cents: number): string {
  return formatter.format(cents / 100);
}

// What the user types ("150", "150.5") -> cents (15000, 15050). Empty or invalid -> null.
export function pesosToCents(value: string): number | null {
  const pesos = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(pesos)) {
    return null;
  }
  return Math.round(pesos * 100);
}
