import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { userSchema, type UserResponse } from "@tracker/shared";

import { AUTH_COOKIE_NAME } from "@/platform/constants";
import { Database } from "@/platform/database/pool";
import { user } from "@/users/users.schema";

import { makeTestApp, TEST_JWT_SECRET } from "../../helpers/app";
import { makeTestDB, resetDB } from "../../helpers/db";

const credentials = { email: "Alice@Example.com", password: "password123", name: "Alice" };

// Supertest types response bodies as `any`.
function bodyOf(res: request.Response) {
  return res.body as Partial<UserResponse> & { error?: string };
}

// Fails if the response drifts from the shared contract the frontend relies on.
function expectUserResponse(res: request.Response) {
  expect(userSchema.safeParse(res.body).error).toBeUndefined();
  return res.body as UserResponse;
}

function authCookie(res: request.Response) {
  const cookies = ([] as string[]).concat(res.headers["set-cookie"] ?? []);
  return cookies.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
}

function tokenCookie(token: string) {
  return `${AUTH_COOKIE_NAME}=${token}`;
}

describe("auth", () => {
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

  async function registerUser() {
    const res = await request(app).post("/auth/register").send(credentials);
    expect(res.status).toBe(201);
    return res;
  }

  describe("POST /auth/register", () => {
    it("creates the user, hashes the password, and sets an httpOnly auth cookie", async () => {
      const res = await registerUser();

      expect(expectUserResponse(res)).toMatchObject({
        email: "alice@example.com",
        name: "Alice",
        role: "member",
      });
      expect(bodyOf(res)).not.toHaveProperty("passwordHash");

      const cookie = authCookie(res);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);

      const [stored] = await db.select().from(user).where(eq(user.email, "alice@example.com"));
      expect(stored.passwordHash).toMatch(/^scrypt\$/);
      expect(stored.passwordHash).not.toContain(credentials.password);
      expect(stored).toMatchObject({ role: "member", active: true });
    });

    it("returns a null name when none is given", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ email: credentials.email, password: credentials.password });

      expect(res.status).toBe(201);
      expect(expectUserResponse(res).name).toBeNull();
    });

    it("rejects an email that is already registered, ignoring case", async () => {
      await registerUser();

      const res = await request(app)
        .post("/auth/register")
        .send({ ...credentials, email: "ALICE@example.com" });

      expect(res.status).toBe(409);
      expect(authCookie(res)).toBeUndefined();
    });

    it.each([
      ["missing email", { password: "password123" }],
      ["invalid email", { email: "not-an-email", password: "password123" }],
      ["short password", { email: "bob@example.com", password: "short" }],
    ])("returns 400 for %s", async (_, body) => {
      const res = await request(app).post("/auth/register").send(body);

      expect(res.status).toBe(400);
      expect(bodyOf(res).error).toBe("Invalid request body");
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(registerUser);

    it("sets an auth cookie for valid credentials", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "alice@example.com", password: credentials.password });

      expect(res.status).toBe(200);
      expect(expectUserResponse(res)).toMatchObject({ email: "alice@example.com" });
      expect(bodyOf(res)).not.toHaveProperty("passwordHash");
      expect(authCookie(res)).toBeDefined();
    });

    it.each([
      ["wrong password", { email: "alice@example.com", password: "wrong-password" }],
      ["unknown email", { email: "nobody@example.com", password: credentials.password }],
    ])("returns 401 for %s", async (_, body) => {
      const res = await request(app).post("/auth/login").send(body);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Invalid email or password" });
      expect(authCookie(res)).toBeUndefined();
    });

    it("returns 400 when fields are missing", async () => {
      const res = await request(app).post("/auth/login").send({ email: "alice@example.com" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /users/me", () => {
    it("returns the current user when the auth cookie is valid", async () => {
      const agent = request.agent(app);
      await agent.post("/auth/register").send(credentials).expect(201);

      const res = await agent.get("/users/me");

      expect(res.status).toBe(200);
      expect(expectUserResponse(res)).toMatchObject({
        email: "alice@example.com",
        name: "Alice",
      });
      expect(bodyOf(res)).not.toHaveProperty("passwordHash");
      expect(bodyOf(res)).not.toHaveProperty("active");
    });

    it("returns 401 without an auth cookie", async () => {
      const res = await request(app).get("/users/me");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("rejects a tampered token", async () => {
      const res = await registerUser();
      const token = authCookie(res)!.split(";")[0].split("=")[1];
      const [header, , signature] = token.split(".");
      const forgedPayload = Buffer.from(JSON.stringify({ sub: "someone-else" })).toString(
        "base64url",
      );

      const me = await request(app)
        .get("/users/me")
        .set("Cookie", tokenCookie(`${header}.${forgedPayload}.${signature}`));

      expect(me.status).toBe(401);
    });

    it("rejects a token signed with a different secret", async () => {
      const res = await registerUser();
      const token = jwt.sign({}, "a-different-secret-that-is-also-32-chars", {
        subject: expectUserResponse(res).id,
      });

      const me = await request(app).get("/users/me").set("Cookie", tokenCookie(token));

      expect(me.status).toBe(401);
    });

    it("rejects an expired token", async () => {
      const res = await registerUser();
      const token = jwt.sign({ exp: Math.floor(Date.now() / 1000) - 60 }, TEST_JWT_SECRET, {
        subject: expectUserResponse(res).id,
      });

      const me = await request(app).get("/users/me").set("Cookie", tokenCookie(token));

      expect(me.status).toBe(401);
    });

    it("rejects an unsigned token", async () => {
      const res = await registerUser();
      const token = jwt.sign({}, "", {
        algorithm: "none",
        subject: expectUserResponse(res).id,
      });

      const me = await request(app).get("/users/me").set("Cookie", tokenCookie(token));

      expect(me.status).toBe(401);
    });

    it("rejects a valid token for a user that no longer exists", async () => {
      const agent = request.agent(app);
      await agent.post("/auth/register").send(credentials).expect(201);
      await resetDB(db);

      const res = await agent.get("/users/me");

      expect(res.status).toBe(401);
    });
  });

  describe("deactivated accounts", () => {
    const deactivatedError = {
      error: "Account is deactivated. Contact admins to reactivate account.",
    };

    async function setActive(active: boolean) {
      await db.update(user).set({ active }).where(eq(user.email, "alice@example.com"));
    }

    it("rejects login with 403 and sets no cookie", async () => {
      await registerUser();
      await setActive(false);

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "alice@example.com", password: credentials.password });

      expect(res.status).toBe(403);
      expect(res.body).toEqual(deactivatedError);
      expect(authCookie(res)).toBeUndefined();
    });

    it("returns 401, not 403, for a wrong password so deactivation is not revealed", async () => {
      await registerUser();
      await setActive(false);

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "alice@example.com", password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Invalid email or password" });
    });

    it("rejects an existing session once the account is deactivated", async () => {
      const agent = request.agent(app);
      await agent.post("/auth/register").send(credentials).expect(201);
      await setActive(false);

      const res = await agent.get("/users/me");

      expect(res.status).toBe(403);
      expect(res.body).toEqual(deactivatedError);
    });

    it("restores access when the account is reactivated", async () => {
      const agent = request.agent(app);
      await agent.post("/auth/register").send(credentials).expect(201);
      await setActive(false);
      await agent.get("/users/me").expect(403);

      await setActive(true);

      await agent.get("/users/me").expect(200);
      await request(app)
        .post("/auth/login")
        .send({ email: "alice@example.com", password: credentials.password })
        .expect(200);
    });
  });

  describe("POST /auth/logout", () => {
    it("clears the auth cookie so later requests are unauthenticated", async () => {
      const agent = request.agent(app);
      await agent.post("/auth/register").send(credentials).expect(201);

      const res = await agent.post("/auth/logout");

      expect(res.status).toBe(204);
      expect(authCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
      await agent.get("/users/me").expect(401);
    });
  });
});
