import express, { NextFunction, Request, Response } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Database } from "@/platform/database/pool";
import { makeRequestIDMiddleware } from "@/platform/middleware";
import { registerHealthPing } from "@/platform/ping";

import { makeTestDB } from "../helpers/db";

function makeApp(db: Database) {
  const app = express();
  app.use(makeRequestIDMiddleware());
  app.use((req: Request, _: Response, next: NextFunction) => {
    req.db = db;
    next();
  });
  registerHealthPing(app);
  return app;
}

describe("GET /", () => {
  let db: Database;

  beforeAll(() => {
    db = makeTestDB();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it("returns 200 when the database is reachable", async () => {
    const res = await request(makeApp(db)).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "PONG", db: "ok" });
  });

  it("returns 503 when the database is unreachable", async () => {
    const closedDB = makeTestDB();
    await closedDB.$client.end();

    const res = await request(makeApp(closedDB)).get("/");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ message: "PONG", db: "unreachable" });
  });
});
