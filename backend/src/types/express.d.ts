import { Database } from "@/platform/database/pool";
import { BackendSettings } from "@/platform/env/backend.env";
import { PublicUser } from "@/users/users.service";

declare global {
  namespace Express {
    interface Locals {
      settings: BackendSettings;
      db: Database;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends PublicUser {}

    interface Request {
      id: string;
      db: Database;
    }
  }
}
