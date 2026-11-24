import { DomainError } from "../../../shared/domain-error.js";
import { normalizePlate } from "../domain/plate.js";
import { calculateTotal } from "../domain/total.js";
import type {
  CatalogReader,
  PaymentMethod,
  ServiceItem,
  ServiceRepository,
  VehicleRepository,
} from "./ports.js";

export interface RegisterServiceInput {
  plate?: string | null;
  vehicleTypeId: number;
  packageId: number;
  extraIds?: number[];
  paymentMethod?: PaymentMethod;
  notes?: string | null;
}

export interface RegisterServiceResult {
  id: number;
  vehicleId: number | null;
  totalCents: number;
  items: ServiceItem[];
}

interface Dependencies {
  catalog: CatalogReader;
  vehicles: VehicleRepository;
  services: ServiceRepository;
}

// Use case: a car arrives and the operator registers its wash.
// Like a Laravel Action class: it gets its dependencies in the constructor.
export class RegisterService {
  readonly #deps: Dependencies;

  constructor(deps: Dependencies) {
    this.#deps = deps;
  }

  async execute(input: RegisterServiceInput): Promise<RegisterServiceResult> {
    const { catalog, vehicles, services } = this.#deps;

    // 1. Prices come from the catalog for this vehicle type, never from the client.
    const pkg = await catalog.findPackagePrice(input.packageId, input.vehicleTypeId);
    if (!pkg) {
      throw new DomainError("The package is not available for this vehicle type");
    }

    const extraIds = [...new Set(input.extraIds ?? [])];
    const extras = await catalog.findExtraPrices(extraIds, input.vehicleTypeId);
    if (extras.length !== extraIds.length) {
      throw new DomainError("One or more extras are not available for this vehicle type");
    }

    // 2. The plate is optional; when it comes, find the car or create it.
    let vehicleId: number | null = null;
    if (input.plate?.trim()) {
      const plate = normalizePlate(input.plate);
      const vehicle =
        (await vehicles.findByPlate(plate)) ??
        (await vehicles.create({ plate, vehicleTypeId: input.vehicleTypeId }));
      vehicleId = vehicle.id;
    }

    // 3. Copy names and prices into the service, so later price changes do not alter it.
    const items: ServiceItem[] = [
      { kind: "package", refId: pkg.id, nameSnapshot: pkg.name, priceCents: pkg.priceCents },
      ...extras.map((extra) => ({
        kind: "extra" as const,
        refId: extra.id,
        nameSnapshot: extra.name,
        priceCents: extra.priceCents,
      })),
    ];
    const totalCents = calculateTotal(items);

    const { id } = await services.create({
      vehicleId,
      vehicleTypeId: input.vehicleTypeId,
      packageId: pkg.id,
      paymentMethod: input.paymentMethod ?? "cash",
      notes: input.notes?.trim() || null,
      totalCents,
      items,
    });

    return { id, vehicleId, totalCents, items };
  }
}
