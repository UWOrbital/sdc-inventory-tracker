import { Express, Router } from "express";

import { loginSchema, registerSchema, userSchema } from "@tracker/shared";

import { login, logout, register } from "@/platform/auth/auth.controller";
import { authenticateCredentials } from "@/platform/auth/strategies";
import { encodeResponse, validateBody } from "@/platform/validation";

export function registerAuthRoutes(app: Express) {
  const router = Router();

  router.post("/register", validateBody(registerSchema), encodeResponse(userSchema), register);
  router.post(
    "/login",
    validateBody(loginSchema),
    authenticateCredentials,
    encodeResponse(userSchema),
    login,
  );
  router.post("/logout", logout);

  app.use("/auth", router);
}
