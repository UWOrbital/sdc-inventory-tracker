import express from "express";

import { Database } from "@/platform/database/pool";
import { BackendSettings } from "@/platform/env/backend.env";
import {
  setupAuth,
  setupDatabase,
  setupEnvSettings,
  setupMiddleware,
  setupRoutes,
} from "@/platform/setups";

export function createApp(settings: BackendSettings, db: Database) {
  const app = express();

  setupEnvSettings(app, settings);
  setupDatabase(app, db);
  setupMiddleware(app);
  setupAuth(app);
  setupRoutes(app);

  return app;
}
