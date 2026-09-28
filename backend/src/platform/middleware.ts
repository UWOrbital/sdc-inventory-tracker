import cors from "cors";
import { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

import { REQUEST_ID_HEADER, VALID_REQUEST_ID } from "@/platform/constants";
import { settings } from "@/platform/env/backend.env";

export function makeCORSMiddleware() {
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
