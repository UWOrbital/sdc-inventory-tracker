import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  userListSchema,
  userSchema,
  type UserListResponse,
  type UserResponse,
  type UserRole,
} from "@tracker/shared";

import { AUTH_COOKIE_NAME } from "@/platform/constants";
import { Database } from "@/platform/database/pool";
import { user } from "@/users/users.schema";

import { makeTestApp } from "../helpers/app";
import { makeTestDB, resetDB } from "../helpers/db";

const PASSWORD = "password123";

// Fail if responses drift from the shared contract the frontend relies on.
function expectUserResponse(res: request.Response) {
  expect(userSchema.safeParse(res.body).error).toBeUndefined();
  return res.body as UserResponse;
}

function expectUserListResponse(res: request.Response) {
  expect(userListSchema.safeParse(res.body).error).toBeUndefined();
  return res.body as UserListResponse;
}

function authCookie(res: request.Response) {
  const cookies = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
  return cookies.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
}

describe("users", () => {
  let db: Database;
  let app: ReturnType<typeof makeTestApp>;

  beforeAll(() => {
    db = makeTestDB();
    app = makeTestApp(db);
  });

  beforeEach(async () => {
    await resetDB(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  // Registers a user with the given role and returns an agent holding their auth cookie.
  async function signUp(email: string, role: UserRole = "member", name?: string) {
    const agent = request.agent(app);
    const res = await agent.post("/auth/register").send({ email, password: PASSWORD, name });
    expect(res.status).toBe(201);
    await db.update(user).set({ role }).where(eq(user.email, email));
    return { agent, id: expectUserResponse(res).id };
  }

  async function findStored(id: string) {
    const [found] = await db.select().from(user).where(eq(user.id, id));
    return found;
  }

  describe("GET /users/me", () => {
    it("returns the current user as a flat object", async () => {
      const { agent, id } = await signUp("alice@example.com", "member", "Alice");

      const res = await agent.get("/users/me");

      expect(res.status).toBe(200);
      expect(expectUserResponse(res)).toEqual({
        id,
        email: "alice@example.com",
        name: "Alice",
        role: "member",
        createdAt: expect.any(String) as string,
      });
    });
  });

  describe("PATCH /users/me", () => {
    it("updates the name", async () => {
      const { agent, id } = await signUp("alice@example.com", "member", "Alice");

      const res = await agent.patch("/users/me").send({ name: "  Alicia  " });

      expect(res.status).toBe(200);
      expect(expectUserResponse(res)).toMatchObject({
        id,
        name: "Alicia",
        email: "alice@example.com",
      });
      expect(res.body).not.toHaveProperty("passwordHash");
      expect(await findStored(id)).toMatchObject({ name: "Alicia", email: "alice@example.com" });
    });

    it("returns the current user unchanged for an empty body", async () => {
      const { agent } = await signUp("alice@example.com", "member", "Alice");

      const res = await agent.patch("/users/me").send({});

      expect(res.status).toBe(200);
      expect(expectUserResponse(res)).toMatchObject({ email: "alice@example.com", name: "Alice" });
    });

    it("ignores attempts to change email, role, active, or password", async () => {
      const { agent, id } = await signUp("alice@example.com");
      const before = await findStored(id);

      const res = await agent.patch("/users/me").send({
        email: "alicia@example.com",
        role: "superuser",
        active: false,
        passwordHash: "x",
        password: "newpassword",
      });

      expect(res.status).toBe(200);
      expect(await findStored(id)).toEqual(before);
    });

    it.each([
      ["empty name", { name: "   " }],
      ["overlong name", { name: "a".repeat(101) }],
    ])("returns 400 for %s", async (_, body) => {
      const { agent } = await signUp("alice@example.com");

      const res = await agent.patch("/users/me").send(body);

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: "Invalid request body" });
    });

    it("returns 401 without an auth cookie", async () => {
      await request(app).patch("/users/me").send({ name: "x" }).expect(401);
    });
  });

  describe("DELETE /users/me", () => {
    it("deactivates the account, clears the cookie, and blocks further access", async () => {
      const { agent, id } = await signUp("alice@example.com");

      const res = await agent.delete("/users/me");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Your account has been deactivated." });
      expect(authCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
      expect(await findStored(id)).toMatchObject({ active: false });
      await request(app)
        .post("/auth/login")
        .send({ email: "alice@example.com", password: PASSWORD })
        .expect(403);
    });

    it("returns 401 without an auth cookie", async () => {
      await request(app).delete("/users/me").expect(401);
    });
  });

  describe("GET /users", () => {
    it("lists every user, oldest first, without private fields", async () => {
      const { agent } = await signUp("root@example.com", "superuser");
      await signUp("alice@example.com");

      const res = await agent.get("/users");

      expect(res.status).toBe(200);
      const { users } = expectUserListResponse(res);
      expect(users.map((u) => u.email)).toEqual(["root@example.com", "alice@example.com"]);
      for (const u of (res.body as { users: object[] }).users) {
        expect(u).not.toHaveProperty("passwordHash");
        expect(u).not.toHaveProperty("active");
      }
    });

    it.each<UserRole>(["member", "admin"])("returns 403 for a %s", async (role) => {
      const { agent } = await signUp("alice@example.com", role);

      const res = await agent.get("/users");

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Forbidden" });
    });

    it("returns 401 without an auth cookie", async () => {
      await request(app).get("/users").expect(401);
    });
  });

  describe("superuser actions on /users/:id", () => {
    it("DELETE removes the user", async () => {
      const { agent } = await signUp("root@example.com", "superuser");
      const { id } = await signUp("alice@example.com");

      const res = await agent.delete(`/users/${id}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: `User ${id} was successfully deleted.` });
      expect(await findStored(id)).toBeUndefined();
    });

    it("POST /deactivate deactivates the user and ends their session", async () => {
      const { agent } = await signUp("root@example.com", "superuser");
      const { agent: alice, id } = await signUp("alice@example.com");

      const res = await agent.post(`/users/${id}/deactivate`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: `User ${id} was deactivated.` });
      expect(await findStored(id)).toMatchObject({ active: false });
      await alice.get("/users/me").expect(403);
    });

    it("POST /activate reactivates the user and restores their session", async () => {
      const { agent } = await signUp("root@example.com", "superuser");
      const { agent: alice, id } = await signUp("alice@example.com");
      await agent.post(`/users/${id}/deactivate`).expect(200);

      const res = await agent.post(`/users/${id}/activate`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: `User ${id} was activated.` });
      expect(await findStored(id)).toMatchObject({ active: true });
      await alice.get("/users/me").expect(200);
    });

    describe.each([
      ["delete", "DELETE", ""],
      ["activate", "POST", "/activate"],
      ["deactivate", "POST", "/deactivate"],
    ] as const)("%s", (_, method, suffix) => {
      function send(agent: ReturnType<typeof request.agent>, id: string) {
        const path = `/users/${id}${suffix}`;
        return method === "DELETE" ? agent.delete(path) : agent.post(path);
      }

      it("returns 404 for an unknown id", async () => {
        const { agent } = await signUp("root@example.com", "superuser");
        const id = randomUUID();

        const res = await send(agent, id);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: `User ${id} was not found.` });
      });

      it("returns 400 for a malformed id", async () => {
        const { agent } = await signUp("root@example.com", "superuser");

        const res = await send(agent, "not-a-uuid");

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "Invalid path parameters" });
      });

      it.each<UserRole>(["member", "admin"])(
        "returns 403 for a %s and leaves the target alone",
        async (role) => {
          const { agent } = await signUp("mallory@example.com", role);
          const { id } = await signUp("alice@example.com");
          const before = await findStored(id);

          const res = await send(agent, id);

          expect(res.status).toBe(403);
          expect(await findStored(id)).toEqual(before);
        },
      );

      it("returns 401 without an auth cookie", async () => {
        const res = await send(request.agent(app), randomUUID());

        expect(res.status).toBe(401);
      });
    });
  });
});
