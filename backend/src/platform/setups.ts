import { Server } from "node:http";

import express, { Express } from "express";

import { settings } from "@/platform/env/backend.env";
import { makeCORSMiddleware, makeRequestIDMiddleware } from "@/platform/middleware";
import { registerHealthPing } from "@/platform/ping";

export function setupEnvSettings(app: Express) {
  app.locals.settings = settings;
}

export function setupMiddleware(app: Express) {
  app.use(makeRequestIDMiddleware());
  app.use(express.json());
  app.use(makeCORSMiddleware());
}

export function setupRoutes(app: Express) {
  registerHealthPing(app);
}

export async function shutdown(signal: string, server: Server) {
  console.log(`${signal} received, shutting down...`);
  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
      server.closeIdleConnections();
    });
    console.log("Shutdown complete");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown", err);
    process.exit(1);
  }
}
