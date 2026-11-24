import { describe, expect, it } from "vitest";
import { formatMoney, pesosToCents } from "./money";

describe("formatMoney", () => {
  it("shows cents as Mexican pesos", () => {
    expect(formatMoney(15000)).toBe("$150.00");
    expect(formatMoney(123456)).toBe("$1,234.56");
  });
});

describe("pesosToCents", () => {
  it.each([
    ["150", 15000],
    ["150.5", 15050],
    ["0,99", 99],
    ["", null],
    ["abc", null],
  ])("%j -> %j", (value, cents) => {
    expect(pesosToCents(value)).toBe(cents);
  });
});
