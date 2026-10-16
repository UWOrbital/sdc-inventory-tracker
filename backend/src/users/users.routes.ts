import { Express, Router } from "express";

import { idParamSchema, userListSchema, userPatchSchema, userSchema } from "@tracker/shared";

import { requireAuth, requireRole } from "@/platform/auth/strategies";
import { encodeResponse, validateBody, validateParams } from "@/platform/validation";
import {
  activateUser,
  deactivateMe,
  deactivateUser,
  deleteUser,
  getAllUsers,
  getMe,
  patchMe,
} from "@/users/users.controller";

export function registerUserRoutes(app: Express) {
  const router = Router();

  router.use(requireAuth);

  router.get("/me", encodeResponse(userSchema), getMe);
  router.patch("/me", validateBody(userPatchSchema), encodeResponse(userSchema), patchMe);
  router.delete("/me", deactivateMe);

  router.get("/", requireRole("superuser"), encodeResponse(userListSchema), getAllUsers);
  router.delete("/:id", requireRole("superuser"), validateParams(idParamSchema), deleteUser);
  router.post(
    "/:id/activate",
    requireRole("superuser"),
    validateParams(idParamSchema),
    activateUser,
  );
  router.post(
    "/:id/deactivate",
    requireRole("superuser"),
    validateParams(idParamSchema),
    deactivateUser,
  );

  app.use("/users", router);
}
