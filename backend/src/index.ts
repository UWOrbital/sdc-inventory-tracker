import { createApp } from "@/app";
import { makeDB } from "@/platform/database/pool";
import { settings } from "@/platform/env/backend.env";
import { shutdown } from "@/platform/setups";

function main() {
  const app = createApp(settings, makeDB(settings));

  const server = app.listen(app.locals.settings.general.PORT, () => {
    console.log(`Server running on port ${app.locals.settings.general.PORT}`);
  });

  process.once("SIGTERM", () => void shutdown("SIGTERM", server, app));
  process.once("SIGINT", () => void shutdown("SIGINT", server, app));
}

main();
