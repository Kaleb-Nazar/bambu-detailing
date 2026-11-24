import { DomainError } from "../../../shared/domain-error.js";
import type {
  PurchaseItem,
  PurchaseRepository,
  SupplierRepository,
  SupplyRepository,
} from "./ports.js";

export interface RegisterPurchaseInput {
  supplierName: string;
  purchasedOn?: string | null; // YYYY-MM-DD, today when empty
  notes?: string | null;
  items: Array<{
    supplyId: number;
    quantity: number;
    unit?: string | null; // the supply default unit when empty
    totalCents: number;
  }>;
}

export interface RegisterPurchaseResult {
  id: number;
  supplierId: number;
  supplierCreated: boolean;
  totalCents: number;
}

interface Dependencies {
  suppliers: SupplierRepository;
  supplies: SupplyRepository;
  purchases: PurchaseRepository;
}

// Use case: the owner bought materials and writes down what, where and for how much.
// Quantity, unit and price are free because they change from store to store.
export class RegisterPurchase {
  readonly #deps: Dependencies;

  constructor(deps: Dependencies) {
    this.#deps = deps;
  }

  async execute(input: RegisterPurchaseInput): Promise<RegisterPurchaseResult> {
    const { suppliers, supplies, purchases } = this.#deps;

    const supplierName = input.supplierName.trim();
    if (!supplierName) {
      throw new DomainError("The supplier name is required");
    }
    if (input.items.length === 0) {
      throw new DomainError("A purchase needs at least one item");
    }

    const supplyIds = input.items.map((item) => item.supplyId);
    if (new Set(supplyIds).size !== supplyIds.length) {
      throw new DomainError("Each supply can appear only once per purchase");
    }

    const found = await supplies.findByIds(supplyIds);
    const supplyById = new Map(found.map((supply) => [supply.id, supply]));

    const items: PurchaseItem[] = input.items.map((item) => {
      const supply = supplyById.get(item.supplyId);
      if (!supply) {
        throw new DomainError(`Unknown supply: ${item.supplyId}`);
      }
      if (!(item.quantity > 0)) {
        throw new DomainError(`The quantity of "${supply.name}" must be greater than 0`);
      }
      if (!Number.isInteger(item.totalCents) || item.totalCents <= 0) {
        throw new DomainError(`The price of "${supply.name}" must be greater than 0`);
      }

      return {
        supplyId: supply.id,
        quantity: item.quantity,
        unit: item.unit?.trim() || supply.defaultUnit,
        totalCents: item.totalCents,
      };
    });

    // A new supplier only needs a name; the rest is filled in later.
    const existing = await suppliers.findByName(supplierName);
    const supplier = existing ?? (await suppliers.create({ name: supplierName }));

    const { id } = await purchases.create({
      supplierId: supplier.id,
      purchasedOn: input.purchasedOn || null,
      notes: input.notes?.trim() || null,
      items,
    });

    return {
      id,
      supplierId: supplier.id,
      supplierCreated: existing === null,
      totalCents: items.reduce((sum, item) => sum + item.totalCents, 0),
    };
  }
}
