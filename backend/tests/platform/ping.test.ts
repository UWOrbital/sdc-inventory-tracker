import express, { NextFunction, Request, Response } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Database } from "@/platform/database/pool";
import { registerHealthPing } from "@/platform/ping";

import { makeTestDB } from "../helpers/db";

function makeApp(db: Database) {
  const app = express();
  app.use((req: Request, _: Response, next: NextFunction) => {
    req.id = "test-request-id";
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
    vi.spyOn(console, "error").mockImplementation(() => {});
    const closedDB = makeTestDB();
    await closedDB.$client.end();

    const res = await request(makeApp(closedDB)).get("/");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ message: "PONG", db: "unreachable" });
  });
});
