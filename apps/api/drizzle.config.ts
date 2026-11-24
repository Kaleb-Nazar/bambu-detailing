import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside the API, so it reads the root .env by itself.
try {
  process.loadEnvFile("../../.env");
} catch {
  // No .env file (for example in CI): use the real environment variables.
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
