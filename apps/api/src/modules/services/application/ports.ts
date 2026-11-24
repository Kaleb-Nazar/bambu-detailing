// Ports: what the use case needs from the outside world, written as interfaces.
// Drizzle implements them in the app; tests implement them in memory.
// (Like binding an interface to a class in a Laravel service provider.)

export type PaymentMethod = "cash" | "transfer";

export interface PricedItem {
  id: number;
  name: string;
  priceCents: number;
}

export interface Vehicle {
  id: number;
  plate: string;
  vehicleTypeId: number;
}

export interface ServiceItem {
  kind: "package" | "extra";
  refId: number;
  nameSnapshot: string;
  priceCents: number;
}

export interface NewService {
  vehicleId: number | null;
  vehicleTypeId: number;
  packageId: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  totalCents: number;
  items: ServiceItem[];
}

export interface CatalogReader {
  // Price of an active package for a vehicle type, or null if it does not exist.
  findPackagePrice(packageId: number, vehicleTypeId: number): Promise<PricedItem | null>;
  // Prices of the active extras found for a vehicle type (missing ones are left out).
  findExtraPrices(extraIds: number[], vehicleTypeId: number): Promise<PricedItem[]>;
}

export interface VehicleRepository {
  findByPlate(plate: string): Promise<Vehicle | null>;
  create(vehicle: { plate: string; vehicleTypeId: number }): Promise<Vehicle>;
}

export interface ServiceRepository {
  create(service: NewService): Promise<{ id: number }>;
}
