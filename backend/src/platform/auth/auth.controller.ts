import { Request, Response } from "express";

import { RegisterBody } from "@/platform/auth/auth.validation";
import { hashPassword } from "@/platform/auth/password";
import { clearAuthCookie, setAuthCookie, signAccessToken } from "@/platform/auth/tokens";
import { createUser, toPublicUser } from "@/users/users.service";

export async function register(req: Request<object, object, RegisterBody>, res: Response) {
  const { email, password, name } = req.body;
  const settings = req.app.locals.settings.auth;

  const created = await createUser(req.db, {
    email,
    name,
    passwordHash: await hashPassword(password),
  });
  if (!created) {
    return res.status(409).json({ error: "Email is already registered" });
  }

  setAuthCookie(res, signAccessToken(created.id, settings), settings);
  res.status(201).json({ user: toPublicUser(created) });
}

export function login(req: Request, res: Response) {
  const settings = req.app.locals.settings.auth;
  setAuthCookie(res, signAccessToken(req.user!.id, settings), settings);
  res.json({ user: req.user });
}

export function logout(req: Request, res: Response) {
  clearAuthCookie(res, req.app.locals.settings.auth);
  res.status(204).end();
}

export function me(req: Request, res: Response) {
  res.json({ user: req.user });
}
