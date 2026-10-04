# Backend logging

pino-http records HTTP access logs using the shared Pino logger. Pino records application events, including
startup, shutdown, and failures inside route handlers. By default, Pino writes
JSON to stdout for trace/debug/info/warn and stderr for error/fatal, without
duplicating messages. Default streams write synchronously so logs are written
before process exit. A custom destination overrides this routing.

Set `LOG_LEVEL` in `.env` to `trace`, `debug`, `info` (default), `warn`, `error`,
`fatal`, or `silent`. It is validated in the general environment schema.
Invalid configuration is reported to stderr before logger initialization.

HTTP logs include request ID, method, path, status, and duration. Headers, bodies,
and query strings are omitted. HTTP 4xx responses log at warn; 5xx and request
errors log at error.

Outside a request, import the shared logger:

```ts
import { logger } from "@/platform/logger";

logger.info({ port: 3000 }, "Server listening");
```

In a route handler, use `req.log` to include the request ID automatically:

```ts
req.log.error({ err }, "Operation failed");
```

Pass errors under `err` so Pino includes their message and stack. Log selected
fields rather than entire request bodies, headers, user records, or environment
settings. The logger redacts top-level password, passwordHash, token,
authorization, and cookie fields; this does not cover arbitrary nested data
or secrets inside message strings.
