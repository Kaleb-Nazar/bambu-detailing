import { beforeEach, describe, expect, it } from "vitest";
import { DomainError } from "../../../shared/domain-error.js";
import type {
  CatalogReader,
  NewService,
  ServiceRepository,
  Vehicle,
  VehicleRepository,
} from "./ports.js";
import { RegisterService } from "./register-service.js";

// In-memory fakes: they behave like the database, but live in an array.

const SEDAN = 1;
const SUV = 2;
const BASIC = 10;
const CARPETS = 20;
const UPHOLSTERY = 21;

const catalog: CatalogReader = {
  async findPackagePrice(packageId, vehicleTypeId) {
    if (packageId === BASIC && vehicleTypeId === SEDAN) {
      return { id: BASIC, name: "Basic", priceCents: 18000 };
    }
    return null;
  },
  async findExtraPrices(extraIds, vehicleTypeId) {
    const prices = [
      { id: CARPETS, name: "Alfombras", priceCents: 8000 },
      { id: UPHOLSTERY, name: "Vestiduras", priceCents: 45000 },
    ];
    return vehicleTypeId === SEDAN ? prices.filter((extra) => extraIds.includes(extra.id)) : [];
  },
};

class InMemoryVehicles implements VehicleRepository {
  rows: Vehicle[] = [];

  async findByPlate(plate: string) {
    return this.rows.find((vehicle) => vehicle.plate === plate) ?? null;
  }

  async create(vehicle: { plate: string; vehicleTypeId: number }) {
    const row = { id: this.rows.length + 1, ...vehicle };
    this.rows.push(row);
    return row;
  }
}

class InMemoryServices implements ServiceRepository {
  rows: NewService[] = [];

  async create(service: NewService) {
    this.rows.push(service);
    return { id: this.rows.length };
  }
}

describe("RegisterService", () => {
  let vehicles: InMemoryVehicles;
  let services: InMemoryServices;
  let registerService: RegisterService;

  beforeEach(() => {
    vehicles = new InMemoryVehicles();
    services = new InMemoryServices();
    registerService = new RegisterService({ catalog, vehicles, services });
  });

  it("saves the service with a copy of names and prices and the total", async () => {
    const result = await registerService.execute({
      plate: "abc-123",
      vehicleTypeId: SEDAN,
      packageId: BASIC,
      extraIds: [CARPETS],
    });

    expect(result.totalCents).toBe(26000);
    expect(services.rows[0]).toEqual({
      vehicleId: 1,
      vehicleTypeId: SEDAN,
      packageId: BASIC,
      paymentMethod: "cash",
      notes: null,
      totalCents: 26000,
      items: [
        { kind: "package", refId: BASIC, nameSnapshot: "Basic", priceCents: 18000 },
        { kind: "extra", refId: CARPETS, nameSnapshot: "Alfombras", priceCents: 8000 },
      ],
    });
  });

  it("creates the vehicle with the normalized plate the first time", async () => {
    await registerService.execute({ plate: "abc 123", vehicleTypeId: SEDAN, packageId: BASIC });

    expect(vehicles.rows).toEqual([{ id: 1, plate: "ABC123", vehicleTypeId: SEDAN }]);
  });

  it("reuses the vehicle when the plate already exists", async () => {
    await registerService.execute({ plate: "ABC123", vehicleTypeId: SEDAN, packageId: BASIC });
    const second = await registerService.execute({
      plate: "abc-123",
      vehicleTypeId: SEDAN,
      packageId: BASIC,
    });

    expect(vehicles.rows).toHaveLength(1);
    expect(second.vehicleId).toBe(1);
  });

  it("works without a plate", async () => {
    const result = await registerService.execute({ vehicleTypeId: SEDAN, packageId: BASIC });

    expect(result.vehicleId).toBeNull();
    expect(vehicles.rows).toHaveLength(0);
  });

  it("counts a repeated extra only once", async () => {
    const result = await registerService.execute({
      vehicleTypeId: SEDAN,
      packageId: BASIC,
      extraIds: [CARPETS, CARPETS],
    });

    expect(result.totalCents).toBe(26000);
  });

  it("fails when the package has no price for the vehicle type", async () => {
    await expect(registerService.execute({ vehicleTypeId: SUV, packageId: BASIC })).rejects.toThrow(
      DomainError,
    );
    expect(services.rows).toHaveLength(0);
  });

  it("fails when an extra does not exist", async () => {
    await expect(
      registerService.execute({ vehicleTypeId: SEDAN, packageId: BASIC, extraIds: [999] }),
    ).rejects.toThrow(DomainError);
  });

  it("fails with an invalid plate and saves nothing", async () => {
    await expect(
      registerService.execute({ plate: "A1", vehicleTypeId: SEDAN, packageId: BASIC }),
    ).rejects.toThrow(DomainError);
    expect(vehicles.rows).toHaveLength(0);
    expect(services.rows).toHaveLength(0);
  });
});
