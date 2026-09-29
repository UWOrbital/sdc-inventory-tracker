import { Server } from "node:http";

import express, { Express } from "express";

import { makeDB } from "@/platform/database/pool";
import { settings } from "@/platform/env/backend.env";
import {
  makeCORSMiddleware,
  makeDrizzleMiddleware,
  makeLoggingMiddleware,
  makeRequestIDMiddleware,
} from "@/platform/middleware";
import { registerHealthPing } from "@/platform/ping";

export function setupEnvSettings(app: Express) {
  app.locals.settings = settings;
}

export function setupDatabase(app: Express) {
  app.locals.db = makeDB(app.locals.settings);
}

export function setupMiddleware(app: Express) {
  app.use(makeRequestIDMiddleware());
  app.use(makeLoggingMiddleware());
  app.use(express.json());
  app.use(makeCORSMiddleware(app.locals.settings));
  app.use(makeDrizzleMiddleware(app.locals.db));
}

export function setupRoutes(app: Express) {
  registerHealthPing(app);
}

export async function shutdown(signal: string, server: Server, app: Express) {
  console.log(`${signal} received, shutting down...`);
  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
      server.closeIdleConnections();
    });
    await app.locals.db.$client.end();
    console.log("Shutdown complete");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown", err);
    process.exit(1);
  }
}
