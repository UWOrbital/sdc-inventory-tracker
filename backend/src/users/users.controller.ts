import { Request, Response } from "express";

import { UserPatchBody } from "@tracker/shared";

import { IdPathParam } from "@/platform/types/params";
import {
  deleteUserById,
  getUserList,
  updateUserActive,
  updateUserById,
} from "@/users/users.service";

export async function getMe(req: Request, res: Response) {
  res.json(req.user);
}

export async function patchMe(req: Request<object, object, UserPatchBody>, res: Response) {
  res.json(await updateUserById(req.db, req.user!.id, req.body));
}

export async function deactivateMe(req: Request, res: Response) {
  await updateUserActive(req.db, req.user!.id, false);
  res.json({ message: "You account has been deactivated." });
}

export async function getAllUsers(req: Request, res: Response) {
  res.json({ users: await getUserList(req.db) });
}

export async function deleteUser(req: Request<IdPathParam>, res: Response) {
  await deleteUserById(req.db, req.params.id);
  res.json({ message: `User ${req.params.id} was successfully deleted.` });
}

export async function activateUser(req: Request<IdPathParam>, res: Response) {
  await updateUserActive(req.db, req.params.id, true);
  res.json({ message: `User ${req.params.id} was activated.` });
}

export async function deactivateUser(req: Request<IdPathParam>, res: Response) {
  await updateUserActive(req.db, req.params.id, false);
  res.json({ message: `User ${req.params.id} was deactivated.` });
}
