import { DomainError } from "../../../shared/domain-error.js";

// Mexican plates have 5 to 8 letters and numbers once spaces and dashes are removed.
const PLATE_PATTERN = /^[A-Z0-9]{5,8}$/;

// "abc-12 3" -> "ABC123", so the same car is always found with the same plate.
export function normalizePlate(raw: string): string {
  const plate = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!PLATE_PATTERN.test(plate)) {
    throw new DomainError(`Invalid plate: "${raw}"`);
  }

  return plate;
}
