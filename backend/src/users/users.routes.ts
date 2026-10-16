import { Express, Router } from "express";

import { authResponseSchema } from "@tracker/shared";

import { requireAuth, requireRole } from "@/platform/auth/strategies";
import { encodeResponse } from "@/platform/validation";
import { deactivateMe, deleteUser, getAllUsers, getMe, patchMe } from "@/users/users.controller";

export function registerUserRoutes(app: Express) {
  const router = Router();

  router.use(requireAuth);

  router.get("/me", encodeResponse(authResponseSchema), getMe);
  router.patch("/me", patchMe);
  router.delete("/me", deactivateMe);

  router.get("/", requireRole("superuser"), getAllUsers);
  router.delete("/:id", requireRole("superuser"), deleteUser);

  app.use("/users", router);
}
