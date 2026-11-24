import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createFakeDependencies } from "./testing/fake-dependencies.js";

const testEnv = {
  NODE_ENV: "test",
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://bambu:secret@localhost:5432/bambu",
};

let app: Awaited<ReturnType<typeof buildApp>>;
let data: ReturnType<typeof createFakeDependencies>["data"];

beforeEach(async () => {
  const fake = createFakeDependencies();
  data = fake.data;
  app = await buildApp(loadConfig(testEnv), fake.deps);
});

afterEach(async () => {
  await app.close();
});

describe("GET /health", () => {
  it("answers 200 with status ok", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});

describe("GET /catalog", () => {
  it("returns packages and extras with prices", async () => {
    const response = await app.inject({ method: "GET", url: "/catalog" });

    expect(response.statusCode).toBe(200);
    expect(response.json().packages[0].prices).toEqual([{ vehicleTypeId: 1, priceCents: 18000 }]);
  });
});

describe("POST /services", () => {
  it("registers a service and answers 201", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/services",
      payload: { plate: "abc-123", vehicleTypeId: 1, packageId: 10, extraIds: [20] },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ id: 1, vehicleId: 1, totalCents: 26000 });
    expect(data.vehicles[0]?.plate).toBe("ABC123");
  });

  it("answers 400 when the body has the wrong shape", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/services",
      payload: { vehicleTypeId: "sedan" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("Bad Request");
  });

  it("answers 422 when a business rule fails", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/services",
      payload: { vehicleTypeId: 1, packageId: 999 },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().message).toMatch(/package/);
  });
});

describe("services of today", () => {
  it("lists them and changes their status", async () => {
    await app.inject({
      method: "POST",
      url: "/services",
      payload: { vehicleTypeId: 1, packageId: 10 },
    });

    const patch = await app.inject({
      method: "PATCH",
      url: "/services/1/status",
      payload: { status: "washing" },
    });
    const list = await app.inject({ method: "GET", url: "/services/today" });

    expect(patch.json()).toEqual({ id: 1, status: "washing" });
    expect(list.json()).toMatchObject([{ id: 1, packageName: "Basic", status: "washing" }]);
  });

  it("answers 404 for a service that does not exist", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/services/99/status",
      payload: { status: "ready" },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe("POST /purchases", () => {
  it("creates the supplier on the fly", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/purchases",
      payload: {
        supplierName: "Tienda nueva",
        items: [{ supplyId: 1, quantity: 2, unit: "galón", totalCents: 50000 }],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ supplierCreated: true, totalCents: 50000 });

    const suppliers = await app.inject({ method: "GET", url: "/suppliers" });
    expect(suppliers.json()).toHaveLength(2);
  });

  it("answers 400 with a quantity of 0", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/purchases",
      payload: { supplierName: "X", items: [{ supplyId: 1, quantity: 0, totalCents: 100 }] },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /reports/weekly", () => {
  it("passes the date to the report", async () => {
    const response = await app.inject({ method: "GET", url: "/reports/weekly?date=2026-11-23" });

    expect(response.statusCode).toBe(200);
    expect(response.json().weekStart).toBe("2026-11-23");
  });

  it("answers 400 with a bad date", async () => {
    const response = await app.inject({ method: "GET", url: "/reports/weekly?date=ayer" });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /docs/json", () => {
  it("publishes the OpenAPI document", async () => {
    const response = await app.inject({ method: "GET", url: "/docs/json" });

    expect(response.statusCode).toBe(200);
    expect(Object.keys(response.json().paths)).toContain("/services");
  });
});
