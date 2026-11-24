import { DomainError } from "../../../shared/domain-error.js";

// Total of a service = package + extras. Prices are whole cents and never negative.
export function calculateTotal(items: ReadonlyArray<{ priceCents: number }>): number {
  let total = 0;

  for (const item of items) {
    if (!Number.isInteger(item.priceCents) || item.priceCents < 0) {
      throw new DomainError(`Invalid price: ${item.priceCents}`);
    }
    total += item.priceCents;
  }

  return total;
}
