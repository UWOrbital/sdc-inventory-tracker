import express, { Request, Response } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { REQUEST_ID_HEADER } from "@/platform/constants";
import { makeRequestIDMiddleware } from "@/platform/middleware";

function makeApp() {
  const app = express();
  app.use(makeRequestIDMiddleware());
  app.get("/", (req: Request, res: Response) => {
    res.json({ id: req.id });
  });
  return app;
}

describe("makeRequestIDMiddleware", () => {
  it("reuses a valid incoming request ID", async () => {
    const res = await request(makeApp()).get("/").set(REQUEST_ID_HEADER, "abc-123");

    expect(res.headers[REQUEST_ID_HEADER.toLowerCase()]).toBe("abc-123");
    expect(res.body).toEqual({ id: "abc-123" });
  });

  it("generates a UUID when the incoming request ID is invalid", async () => {
    const res = await request(makeApp()).get("/").set(REQUEST_ID_HEADER, "bad id!");

    const id = res.headers[REQUEST_ID_HEADER.toLowerCase()];
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body).toEqual({ id });
  });

  it("generates a UUID when no request ID is provided", async () => {
    const res = await request(makeApp()).get("/");

    expect(res.headers[REQUEST_ID_HEADER.toLowerCase()]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("binds an isolated logger to each request ID", async () => {
    const app = express();
    app.use(makeRequestIDMiddleware());
    app.get("/", (req, res) => res.json(req.log.bindings()));

    const [first, second] = await Promise.all([
      request(app).get("/").set(REQUEST_ID_HEADER, "first"),
      request(app).get("/").set(REQUEST_ID_HEADER, "second"),
    ]);
    expect(first.body).toMatchObject({ requestId: "first" });
    expect(second.body).toMatchObject({ requestId: "second" });
  });
});
