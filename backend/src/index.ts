import express from "express";

import {
  setupDatabase,
  setupEnvSettings,
  setupMiddleware,
  setupRoutes,
  shutdown,
} from "@/platform/setups";

function main() {
  const app = express();

  setupEnvSettings(app);
  setupDatabase(app);
  setupMiddleware(app);
  setupRoutes(app);

  const server = app.listen(app.locals.settings.general.PORT, () => {
    console.log(`Server running on port ${app.locals.settings.general.PORT}`);
  });

  process.once("SIGTERM", () => void shutdown("SIGTERM", server, app));
  process.once("SIGINT", () => void shutdown("SIGINT", server, app));
}

main();
