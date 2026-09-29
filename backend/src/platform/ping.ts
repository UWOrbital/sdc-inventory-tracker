import { sql } from "drizzle-orm";
import { Express, Request, Response } from "express";

export function registerHealthPing(app: Express) {
  app.get("/", async (req: Request, res: Response) => {
    try {
      await req.db.execute(sql`SELECT 1`);
      res.json({ message: "PONG", db: "ok" });
    } catch (err) {
      console.error(`[${req.id}] Health check DB ping failed`, err);
      res.status(503).json({ message: "PONG", db: "unreachable" });
    }
  });
}
