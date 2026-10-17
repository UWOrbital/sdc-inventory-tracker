import type { Logger } from "pino";

import { Database } from "@/platform/database/pool";
import { BackendSettings } from "@/platform/env/backend.env";
import { User as DbUser } from "@/users/users.schema";

declare global {
  namespace Express {
    interface Locals {
      settings: BackendSettings;
      db: Database;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends DbUser {}

    interface Request {
      log: Logger;
      id: string;
      db: Database;
    }
  }
}
