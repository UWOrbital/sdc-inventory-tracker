import { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";

import { AUTH_COOKIE_NAME, JWT_ALGORITHM } from "@/platform/constants";
import { AuthSettings } from "@/platform/env/auth.env";

export function signAccessToken(userId: string, settings: AuthSettings) {
  return jwt.sign({}, settings.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    subject: userId,
    expiresIn: settings.JWT_EXPIRES_IN_SECONDS,
  });
}

function cookieOptions(settings: AuthSettings): CookieOptions {
  return {
    httpOnly: true,
    secure: settings.AUTH_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
  };
}

export function setAuthCookie(res: Response, token: string, settings: AuthSettings) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...cookieOptions(settings),
    maxAge: settings.JWT_EXPIRES_IN_SECONDS * 1000,
  });
}

export function clearAuthCookie(res: Response, settings: AuthSettings) {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions(settings));
}
