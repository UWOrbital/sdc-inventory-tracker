import { settings } from "@/platform/env/backend.env";
import cors from "cors";

export function makeCORSMiddleware() {
  return cors({
    origin: settings.cors.CORS_ALLOW_ORIGINS,
    credentials: settings.cors.CORS_ALLOW_CREDENTIALS,
    allowedHeaders: settings.cors.CORS_ALLOW_HEADERS,
    methods: settings.cors.CORS_ALLOW_METHODS,
  });
}
