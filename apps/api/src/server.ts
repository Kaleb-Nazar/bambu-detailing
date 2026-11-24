import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createContainer } from "./container.js";
import { createDb } from "./db/client.js";

const config = loadConfig();
const { db, close } = createDb(config.DATABASE_URL);
const app = await buildApp(config, createContainer(db));

// Close the database connection when the server stops.
app.addHook("onClose", async () => {
  await close();
});

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
