import { NextFunction, Request, Response } from "express";
import z from "zod";

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

// Express has no post-handler hook, so this must run before the handler: it wraps
// res.json so successful bodies are encoded to the wire format (dropping unlisted keys
// like passwordHash). Error bodies (non-2xx) pass through as-is.
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
