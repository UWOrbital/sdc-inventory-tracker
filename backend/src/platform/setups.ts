import { settings } from "@/platform/env/backend.env";
import { makeCORSMiddleware } from "@/platform/middleware";
import express, { Express } from "express";

export function setupEnvSettings(app: Express) {
  app.locals.settings = settings;
}

export function setupMiddleware(app: Express) {
  app.use(express.json());
  app.use(makeCORSMiddleware());
}
