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
