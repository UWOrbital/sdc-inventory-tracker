import "dotenv/config";

import pino from "pino";
import z from "zod";

const logLevel = z
  .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
  .default("info")
  .parse(process.env.LOG_LEVEL);

// Independent of BackendSettings so configuration failures can also be logged.
export function createLogger(destination?: pino.DestinationStream) {
  const options: pino.LoggerOptions = {
    level: logLevel,
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
