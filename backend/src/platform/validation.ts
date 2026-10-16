import { NextFunction, Request, RequestHandler, Response } from "express";
import z from "zod";

import { ParamsDictionary } from "@/platform/types/params";

export function validateBody<S extends z.ZodType>(schema: S) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid request body",
        issues: z.flattenError(result.error).fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

// Rejects malformed path params (e.g. a non-UUID id) before they reach the database.
export function validateParams<P = ParamsDictionary>(schema: z.ZodType): RequestHandler<P> {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid path parameters",
        issues: z.flattenError(result.error).fieldErrors,
      });
      return;
    }
    next();
  };
}

export function encodeResponse<S extends z.ZodType>(schema: S) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const json = res.json.bind(res);
    res.json = (body: unknown) => {
      const ok = res.statusCode >= 200 && res.statusCode < 300;
      return json(ok ? schema.encode(body as z.output<S>) : body);
    };
    next();
  };
}
