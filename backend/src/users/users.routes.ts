import { Express, Router } from "express";

import { requireAuth, requireRole } from "@/platform/auth/strategies";
import { deactivateMe, deleteUser, getAllUsers, getMe, patchMe } from "@/users/users.controller";

export function registerUserRoutes(app: Express) {
  const router = Router();

  router.use(requireAuth);

  router.get("/me", getMe);
  router.patch("/me", patchMe);
  router.delete("/me", deactivateMe);

  router.get("/", requireRole("superuser"), getAllUsers);
  router.delete("/:id", requireRole("superuser"), deleteUser);

  app.use("/users", router);
}
