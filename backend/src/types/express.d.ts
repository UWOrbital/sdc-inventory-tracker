import { BackendSettings } from "@/platform/env/backend.env";

declare global {
  namespace Express {
    interface Locals {
      settings: BackendSettings;
    }
  }
}
