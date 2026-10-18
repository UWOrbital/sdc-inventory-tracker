import { Request, Response } from "express";

import { UserPatchBody } from "@tracker/shared";

import { clearAuthCookie } from "@/platform/auth/tokens";
import { IdPathParam } from "@/platform/types/params";
import {
  deleteUserById,
  getUserList,
  updateUserActive,
  updateUserById,
} from "@/users/users.service";

function userNotFound(res: Response, id: string) {
  return res.status(404).json({ error: `User ${id} was not found.` });
}

export function getMe(req: Request, res: Response) {
  res.json(req.user);
}

export async function patchMe(req: Request<object, object, UserPatchBody>, res: Response) {
  const updated = await updateUserById(req.db, req.user!.id, req.body);
  if (updated === null) {
    return res.status(409).json({ error: "Email is already registered" });
  }
  res.json(updated);
}

export async function deactivateMe(req: Request, res: Response) {
  await updateUserActive(req.db, req.user!.id, false);
  clearAuthCookie(res, req.app.locals.settings.auth);
  res.json({ message: "Your account has been deactivated." });
}

export async function getAllUsers(req: Request, res: Response) {
  res.json({ users: await getUserList(req.db) });
}

export async function deleteUser(req: Request<IdPathParam>, res: Response) {
  if (!(await deleteUserById(req.db, req.params.id))) return userNotFound(res, req.params.id);
  res.json({ message: `User ${req.params.id} was successfully deleted.` });
}

export async function activateUser(req: Request<IdPathParam>, res: Response) {
  if (!(await updateUserActive(req.db, req.params.id, true)))
    return userNotFound(res, req.params.id);
  res.json({ message: `User ${req.params.id} was activated.` });
}

export async function deactivateUser(req: Request<IdPathParam>, res: Response) {
  if (!(await updateUserActive(req.db, req.params.id, false)))
    return userNotFound(res, req.params.id);
  res.json({ message: `User ${req.params.id} was deactivated.` });
}
