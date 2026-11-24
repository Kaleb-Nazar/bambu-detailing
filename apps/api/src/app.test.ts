import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

const testEnv = {
  NODE_ENV: "test",
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://bambu:secret@localhost:5432/bambu",
};

describe("GET /health", () => {
  it("answers 200 with status ok", async () => {
    const app = buildApp(loadConfig(testEnv));

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });

    await app.close();
  });
});

describe("loadConfig", () => {
  it("uses defaults for optional settings", () => {
    const config = loadConfig(testEnv);

    expect(config.PORT).toBe(3000);
    expect(config.HOST).toBe("127.0.0.1");
  });

  it("fails when DATABASE_URL is missing", () => {
    expect(() => loadConfig({ NODE_ENV: "test" })).toThrow(/DATABASE_URL/);
  });
});
