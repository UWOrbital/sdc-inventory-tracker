import { Request, Response } from "express";

import type { RegisterBody } from "@tracker/shared";

import { hashPassword } from "@/platform/auth/password";
import { clearAuthCookie, setAuthCookie, signAccessToken } from "@/platform/auth/tokens";
import { isUniqueViolation } from "@/platform/database/abstract-repository";
import { UserRepository } from "@/users/users.service";

export async function register(req: Request<object, object, RegisterBody>, res: Response) {
  const { email, password, name } = req.body;
  const settings = req.app.locals.settings.auth;

  let created;
  try {
    created = await new UserRepository(req.db).create({
      email,
      name,
      passwordHash: await hashPassword(password),
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(409).json({ error: "Email is already registered" });
    }
    throw err;
  }

  setAuthCookie(res, signAccessToken(created.id, settings), settings);
  res.status(201).json(created);
}

export function login(req: Request, res: Response) {
  const settings = req.app.locals.settings.auth;
  setAuthCookie(res, signAccessToken(req.user!.id, settings), settings);
  res.json(req.user);
}

export function logout(req: Request, res: Response) {
  clearAuthCookie(res, req.app.locals.settings.auth);
  res.status(204).end();
}
