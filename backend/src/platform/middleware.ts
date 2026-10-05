import { randomUUID } from "node:crypto";

import cors from "cors";
import { NextFunction, Request, Response } from "express";
import pinoHttp from "pino-http";

import { REQUEST_ID_HEADER, VALID_REQUEST_ID } from "@/platform/constants";
import { Database } from "@/platform/database/pool";
import { BackendSettings } from "@/platform/env/backend.env";
import { logger } from "@/platform/logger";

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

export function makeLoggingMiddleware(applicationLogger = logger) {
  return pinoHttp<Request, Response>({
    logger: applicationLogger,
    genReqId: (req) => req.id,
    quietReqLogger: true,
    customAttributeKeys: { reqId: "requestId" },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      return res.statusCode >= 400 ? "warn" : "info";
    },
    wrapSerializers: false,
    serializers: {
      req: (req: Request) => ({ id: req.id, method: req.method, url: req.url.split("?")[0] }),
      res: (res: Response) => ({ statusCode: res.statusCode }),
    },
  });
}
