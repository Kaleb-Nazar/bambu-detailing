// Ports for the supplies module (see services/application/ports.ts for the idea).

export interface Supplier {
  id: number;
  name: string;
}

export interface Supply {
  id: number;
  name: string;
  defaultUnit: string;
}

export interface PurchaseItem {
  supplyId: number;
  quantity: number;
  unit: string;
  totalCents: number;
}

export interface NewPurchase {
  supplierId: number;
  purchasedOn: string | null;
  notes: string | null;
  items: PurchaseItem[];
}

export interface SupplierRepository {
  // Case-insensitive: "costco" and "Costco" are the same supplier.
  findByName(name: string): Promise<Supplier | null>;
  create(supplier: { name: string }): Promise<Supplier>;
}

export interface SupplyRepository {
  // Active supplies with these ids (missing ones are left out).
  findByIds(ids: number[]): Promise<Supply[]>;
}

export interface PurchaseRepository {
  create(purchase: NewPurchase): Promise<{ id: number }>;
}
