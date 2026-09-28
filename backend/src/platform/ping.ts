import { Express, Request, Response } from "express";

export function registerHealthPing(app: Express) {
  app.get("/", (_: Request, res: Response) => {
    res.json({ message: "PONG" });
  });
}
