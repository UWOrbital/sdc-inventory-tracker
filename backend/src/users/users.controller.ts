import { Request, Response } from "express";

import { authResponseSchema } from "@tracker/shared";

import { IdPathParam } from "@/platform/types/params";

export async function getMe(req: Request, res: Response) {
  res.json(authResponseSchema.encode({ user: req.user! }));
}

export async function patchMe(req: Request, res: Response) {}

export async function deactivateMe(req: Request, res: Response) {}

export async function getAllUsers(req: Request, res: Response) {}

export async function deleteUser(req: Request<IdPathParam>, res: Response) {}
