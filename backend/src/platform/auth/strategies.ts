import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";

import { getDummyHash, verifyPassword } from "@/platform/auth/password";
import { AUTH_COOKIE_NAME, JWT_ALGORITHM } from "@/platform/constants";
import { findUserByEmail, findUserById, toPublicUser } from "@/users/users.service";

function cookieExtractor(req: Request): string | null {
  const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];
  return typeof token === "string" ? token : null;
}

export function registerAuthStrategies() {
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passReqToCallback: true, session: false },
      (req, email, password, done) => {
        void (async () => {
          const found = await findUserByEmail(req.db, email);
          const valid = await verifyPassword(
            password,
            found?.passwordHash ?? (await getDummyHash()),
          );
          return found?.passwordHash && valid ? toPublicUser(found) : false;
        })().then((user) => done(null, user), done);
      },
    ),
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: cookieExtractor,
        // Read the secret per request so each app instance uses its own settings.
        secretOrKeyProvider: (req: Request, _token, done) =>
          done(null, req.app.locals.settings.auth.JWT_SECRET),
        algorithms: [JWT_ALGORITHM],
        passReqToCallback: true,
      },
      (req: Request, payload: { sub?: string }, done) => {
        if (!payload.sub) return done(null, false);
        findUserById(req.db, payload.sub).then(
          (found) => done(null, found ? toPublicUser(found) : false),
          done,
        );
      },
    ),
  );
}

function authenticate(strategy: "local" | "jwt", message: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const middleware = passport.authenticate(
      strategy,
      { session: false },
      (err: unknown, user: Express.User | false | undefined) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: message });
        req.user = user;
        next();
      },
    ) as (req: Request, res: Response, next: NextFunction) => void;
    middleware(req, res, next);
  };
}

export const authenticateCredentials = authenticate("local", "Invalid email or password");
export const requireAuth = authenticate("jwt", "Unauthorized");
