import { registerHealthPing } from "@/platform/ping";
import { setupEnvSettings, setupMiddleware } from "@/platform/setups";
import express from "express";

function main() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  setupEnvSettings(app);
  setupMiddleware(app);
  registerHealthPing(app);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main();
