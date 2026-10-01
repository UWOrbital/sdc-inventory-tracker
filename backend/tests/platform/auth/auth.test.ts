import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { AUTH_COOKIE_NAME } from "@/platform/constants";
import { Database } from "@/platform/database/pool";
import { user } from "@/users/users.schema";
import { PublicUser } from "@/users/users.service";

import { makeTestApp, TEST_JWT_SECRET } from "../../helpers/app";
import { makeTestDB, resetDB } from "../../helpers/db";

const credentials = { email: "Alice@Example.com", password: "password123", name: "Alice" };

// Supertest types response bodies as `any`.
function bodyOf(res: request.Response) {
  return res.body as { user: PublicUser; error?: string };
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

      expect(bodyOf(res).user).toMatchObject({ email: "alice@example.com", name: "Alice" });
      expect(bodyOf(res).user).not.toHaveProperty("passwordHash");

      const cookie = authCookie(res);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);

      const [stored] = await db.select().from(user).where(eq(user.email, "alice@example.com"));
      expect(stored.passwordHash).toMatch(/^scrypt\$/);
      expect(stored.passwordHash).not.toContain(credentials.password);
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
      expect(bodyOf(res).user).toMatchObject({ email: "alice@example.com" });
      expect(bodyOf(res).user).not.toHaveProperty("passwordHash");
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

  describe("GET /auth/me", () => {
    it("returns the current user when the auth cookie is valid", async () => {
      const agent = request.agent(app);
      await agent.post("/auth/register").send(credentials).expect(201);

      const res = await agent.get("/auth/me");

      expect(res.status).toBe(200);
      expect(bodyOf(res).user).toMatchObject({ email: "alice@example.com", name: "Alice" });
      expect(bodyOf(res).user).not.toHaveProperty("passwordHash");
    });

    it("returns 401 without an auth cookie", async () => {
      const res = await request(app).get("/auth/me");

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
        .get("/auth/me")
        .set("Cookie", tokenCookie(`${header}.${forgedPayload}.${signature}`));

      expect(me.status).toBe(401);
    });

    it("rejects a token signed with a different secret", async () => {
      const res = await registerUser();
      const token = jwt.sign({}, "a-different-secret-that-is-also-32-chars", {
        subject: bodyOf(res).user.id,
      });

      const me = await request(app).get("/auth/me").set("Cookie", tokenCookie(token));

      expect(me.status).toBe(401);
    });

    it("rejects an expired token", async () => {
      const res = await registerUser();
      const token = jwt.sign({ exp: Math.floor(Date.now() / 1000) - 60 }, TEST_JWT_SECRET, {
        subject: bodyOf(res).user.id,
      });

      const me = await request(app).get("/auth/me").set("Cookie", tokenCookie(token));

      expect(me.status).toBe(401);
    });

    it("rejects an unsigned token", async () => {
      const res = await registerUser();
      const token = jwt.sign({}, "", { algorithm: "none", subject: bodyOf(res).user.id });

      const me = await request(app).get("/auth/me").set("Cookie", tokenCookie(token));

      expect(me.status).toBe(401);
    });

    it("rejects a valid token for a user that no longer exists", async () => {
      const agent = request.agent(app);
      await agent.post("/auth/register").send(credentials).expect(201);
      await resetDB(db);

      const res = await agent.get("/auth/me");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /auth/logout", () => {
    it("clears the auth cookie so later requests are unauthenticated", async () => {
      const agent = request.agent(app);
      await agent.post("/auth/register").send(credentials).expect(201);

      const res = await agent.post("/auth/logout");

      expect(res.status).toBe(204);
      expect(authCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
      await agent.get("/auth/me").expect(401);
    });
  });
});
