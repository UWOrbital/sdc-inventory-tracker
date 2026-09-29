import { Database } from "@/platform/database/pool";
import { BackendSettings } from "@/platform/env/backend.env";

declare global {
  namespace Express {
    interface Locals {
      settings: BackendSettings;
      db: Database;
    }

    interface Request {
      id: string;
      db: Database;
    }
  }
}
