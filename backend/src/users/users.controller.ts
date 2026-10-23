import { Request, Response } from "express";

import { UserPatchBody } from "@tracker/shared";

import { clearAuthCookie } from "@/platform/auth/tokens";
import { NotFoundError } from "@/platform/database/abstract-repository";
import { IdPathParam } from "@/platform/types/params";
import { UserRepository } from "@/users/users.service";

export function getMe(req: Request, res: Response) {
  res.json(req.user);
}

export async function patchMe(req: Request<object, object, UserPatchBody>, res: Response) {
  if (Object.keys(req.body).length === 0) return res.json(req.user);
  res.json(await new UserRepository(req.db).update(req.user!.id, req.body));
}

export async function deactivateMe(req: Request, res: Response) {
  await new UserRepository(req.db).update(req.user!.id, { active: false });
  clearAuthCookie(res, req.app.locals.settings.auth);
  res.json({ message: "Your account has been deactivated." });
}

export async function getAllUsers(req: Request, res: Response) {
  res.json({ users: await new UserRepository(req.db).getAll() });
}

export async function deleteUser(req: Request<IdPathParam>, res: Response) {
  try {
    await new UserRepository(req.db).deleteById(req.params.id);
  } catch (err) {
    if (err instanceof NotFoundError)
      res.status(404).json({ error: `User ${req.params.id} was not found.` });
    throw err;
  }
  res.json({ message: `User ${req.params.id} was successfully deleted.` });
}

export async function activateUser(req: Request<IdPathParam>, res: Response) {
  try {
    await new UserRepository(req.db).update(req.params.id, { active: true });
  } catch (err) {
    if (err instanceof NotFoundError)
      res.status(404).json({ error: `User ${req.params.id} was not found.` });
    throw err;
  }
  res.json({ message: `User ${req.params.id} was activated.` });
}

export async function deactivateUser(req: Request<IdPathParam>, res: Response) {
  try {
    await new UserRepository(req.db).update(req.params.id, { active: false });
  } catch (err) {
    if (err instanceof NotFoundError)
      res.status(404).json({ error: `User ${req.params.id} was not found.` });
    throw err;
  }
  res.json({ message: `User ${req.params.id} was deactivated.` });
}
