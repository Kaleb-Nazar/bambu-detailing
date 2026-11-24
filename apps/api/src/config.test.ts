import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("uses defaults for optional settings", () => {
    const config = loadConfig({ DATABASE_URL: "postgresql://bambu:secret@localhost:5432/bambu" });

    expect(config.PORT).toBe(3000);
    expect(config.HOST).toBe("127.0.0.1");
  });

  it("fails when DATABASE_URL is missing", () => {
    expect(() => loadConfig({ NODE_ENV: "test" })).toThrow(/DATABASE_URL/);
  });
});
