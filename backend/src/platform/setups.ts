import { Server } from "node:http";

import cookieParser from "cookie-parser";
import express, { Express } from "express";
import passport from "passport";

import { registerAuthRoutes } from "@/platform/auth/auth.routes";
import { registerAuthStrategies } from "@/platform/auth/strategies";
import { Database } from "@/platform/database/pool";
import { BackendSettings } from "@/platform/env/backend.env";
import { logger } from "@/platform/logger";
import {
  makeCORSMiddleware,
  makeDrizzleMiddleware,
  makeLoggingMiddleware,
  makeRequestIDMiddleware,
} from "@/platform/middleware";
import { registerHealthPing } from "@/platform/ping";

export function setupEnvSettings(app: Express, settings: BackendSettings) {
  app.locals.settings = settings;
}

export function setupDatabase(app: Express, db: Database) {
  app.locals.db = db;
}

export function setupMiddleware(app: Express) {
  app.use(makeRequestIDMiddleware());
  app.use(makeLoggingMiddleware());
  app.use(express.json());
  app.use(cookieParser());
  app.use(makeCORSMiddleware(app.locals.settings));
  app.use(makeDrizzleMiddleware(app.locals.db));
}

export function setupAuth(app: Express) {
  registerAuthStrategies();
  app.use(passport.initialize());
}

export function setupRoutes(app: Express) {
  registerHealthPing(app);
  registerAuthRoutes(app);
}

export async function shutdown(signal: string, server: Server, app: Express) {
  logger.info({ signal }, "Shutting down");
  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
      server.closeIdleConnections();
    });
    await app.locals.db.$client.end();
    logger.info("Shutdown complete");
    logger.flush();
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    logger.flush();
    process.exit(1);
  }
}
