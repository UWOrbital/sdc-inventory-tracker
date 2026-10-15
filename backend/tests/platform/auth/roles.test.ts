import { eq } from "drizzle-orm";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { UserRole } from "@tracker/shared";

import { requireAuth, requireRole } from "@/platform/auth/strategies";
import { Database } from "@/platform/database/pool";
import { user } from "@/users/users.schema";

import { makeTestApp } from "../../helpers/app";
import { makeTestDB, resetDB } from "../../helpers/db";

const credentials = { email: "alice@example.com", password: "password123" };

describe("requireRole", () => {
  let db: Database;
  let app: ReturnType<typeof makeTestApp>;

  beforeAll(() => {
    db = makeTestDB();
    app = makeTestApp(db);
    app.get("/admin-only", requireAuth, requireRole("admin", "superuser"), (_req, res) => {
      res.json({ ok: true });
    });
    app.get("/superuser-only", requireAuth, requireRole("superuser"), (_req, res) => {
      res.json({ ok: true });
    });
  });

  beforeEach(async () => {
    await resetDB(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  // Registers Alice with the given role and returns an agent holding her auth cookie.
  async function agentWithRole(role: UserRole) {
    const agent = request.agent(app);
    await agent.post("/auth/register").send(credentials).expect(201);
    await db.update(user).set({ role }).where(eq(user.email, credentials.email));
    return agent;
  }

  it.each<[UserRole, string, number]>([
    ["member", "/admin-only", 403],
    ["admin", "/admin-only", 200],
    ["superuser", "/admin-only", 200],
    ["member", "/superuser-only", 403],
    ["admin", "/superuser-only", 403],
    ["superuser", "/superuser-only", 200],
  ])("%s requesting %s gets %i", async (role, path, status) => {
    const agent = await agentWithRole(role);

    const res = await agent.get(path);

    expect(res.status).toBe(status);
    expect(res.body).toEqual(status === 200 ? { ok: true } : { error: "Forbidden" });
  });

  it("reads the role per request, so a role change takes effect without re-login", async () => {
    const agent = await agentWithRole("admin");
    await agent.get("/admin-only").expect(200);

    await db.update(user).set({ role: "member" }).where(eq(user.email, credentials.email));

    await agent.get("/admin-only").expect(403);
  });

  it("returns 401 without an auth cookie", async () => {
    const res = await request(app).get("/admin-only");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 403 for a deactivated admin before checking the role", async () => {
    const agent = await agentWithRole("admin");
    await db.update(user).set({ active: false }).where(eq(user.email, credentials.email));

    const res = await agent.get("/admin-only");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: "Account is deactivated. Contact admins to reactivate account.",
    });
  });

  it("returns 401 when used without requireAuth", async () => {
    const bare = express();
    bare.get("/", requireRole("admin"), (_req, res) => {
      res.json({ ok: true });
    });

    const res = await request(bare).get("/");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});
