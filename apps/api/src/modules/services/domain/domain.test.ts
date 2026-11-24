import { describe, expect, it } from "vitest";
import { DomainError } from "../../../shared/domain-error.js";
import { normalizePlate } from "./plate.js";
import { calculateTotal } from "./total.js";

describe("normalizePlate", () => {
  it("removes spaces and dashes and uses capital letters", () => {
    expect(normalizePlate(" abc-12 3 ")).toBe("ABC123");
  });

  it.each(["", "AB1", "ABCDE12345", "---"])("rejects %j", (plate) => {
    expect(() => normalizePlate(plate)).toThrow(DomainError);
  });
});

describe("calculateTotal", () => {
  it("adds package and extras", () => {
    expect(calculateTotal([{ priceCents: 18000 }, { priceCents: 8000 }])).toBe(26000);
  });

  it("is 0 with no items", () => {
    expect(calculateTotal([])).toBe(0);
  });

  it.each([-100, 10.5])("rejects the price %d", (priceCents) => {
    expect(() => calculateTotal([{ priceCents }])).toThrow(DomainError);
  });
});
