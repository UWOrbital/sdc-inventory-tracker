import { randomUUID } from "node:crypto";

import cors from "cors";
import { NextFunction, Request, Response } from "express";
import morgan from "morgan";

import { LOG_FORMAT, REQUEST_ID_HEADER, VALID_REQUEST_ID } from "@/platform/constants";
import { Database } from "@/platform/database/pool";
import { BackendSettings } from "@/platform/env/backend.env";

export function makeCORSMiddleware(settings: BackendSettings) {
  return cors({
    origin: settings.cors.CORS_ALLOW_ORIGINS,
    credentials: settings.cors.CORS_ALLOW_CREDENTIALS,
    allowedHeaders: settings.cors.CORS_ALLOW_HEADERS,
    methods: settings.cors.CORS_ALLOW_METHODS,
  });
}

export function makeRequestIDMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.get(REQUEST_ID_HEADER);
    req.id = incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, req.id);
    next();
  };
}

export function makeDrizzleMiddleware(db: Database) {
  return (req: Request, _: Response, next: NextFunction) => {
    req.db = db;
    next();
  };
}

morgan.token<Request, Response>("id", (req) => req.id);

export function makeLoggingMiddleware() {
  return morgan<Request, Response>(LOG_FORMAT);
}
