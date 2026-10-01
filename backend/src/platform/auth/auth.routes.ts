import { Express, Router } from "express";

import { login, logout, me, register } from "@/platform/auth/auth.controller";
import { loginSchema, registerSchema } from "@/platform/auth/auth.validation";
import { authenticateCredentials, requireAuth } from "@/platform/auth/strategies";
import { validateBody } from "@/platform/validation";

export function registerAuthRoutes(app: Express) {
  const router = Router();

  router.post("/register", validateBody(registerSchema), register);
  router.post("/login", validateBody(loginSchema), authenticateCredentials, login);
  router.post("/logout", logout);
  router.get("/me", requireAuth, me);

  app.use("/auth", router);
}
