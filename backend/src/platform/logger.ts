import pino from "pino";

import { generalSettings } from "@/platform/env/general.env";

export function createLogger(destination?: pino.DestinationStream) {
  const options: pino.LoggerOptions = {
    level: generalSettings.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: ["password", "passwordHash", "token", "authorization", "cookie"],
  };
  if (destination) return pino(options, destination);

  const streams = pino.multistream(
    [
      { level: "trace", stream: pino.destination({ dest: 1, sync: true }) },
      { level: "error", stream: pino.destination({ dest: 2, sync: true }) },
    ],
    { dedupe: true },
  );
  return pino(options, streams);
}

export const logger = createLogger();
