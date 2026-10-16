# Sharing Types Between Frontend and Backend

Request and response shapes live once, as [Zod](https://zod.dev) schemas, in the `@tracker/shared` workspace package (`shared/`). The backend uses them to validate requests, and the frontend imports the same schemas and their inferred types. Don't redefine an API shape in `frontend/` or `backend/`.

## Setup

The repo is a [pnpm workspace](https://pnpm.io/workspaces) (`backend`, `frontend`, `shared`). From anywhere in the repo:

```sh
pnpm install
```

This links `@tracker/shared` into both apps and builds `shared/dist` (via its `prepare` script).

## Adding or changing a shape

1. Add or edit a schema in `shared/src/<domain>.ts`, export it from `shared/src/index.ts`, and derive types from the schema rather than writing them by hand:

   ```ts
   export const createItemSchema = z.object({
     name: z.string().min(1),
     count: z.int().min(0),
   });
   export type CreateItemRequest = z.input<typeof createItemSchema>; // what the client sends
   export type CreateItemBody = z.output<typeof createItemSchema>; // what the handler receives
   ```

   Response schemas map the JSON on the wire to app types: dates use a codec (ISO string in, `Date` out). Export response types with `z.input` (the wire shape). The backend builds a response with `schema.encode(value)`, which also drops any keys the schema doesn't list (e.g. `passwordHash`), so no hand-written serializer is needed.

2. Validate requests with the schema in the backend:

   ```ts
   import { createItemSchema } from "@tracker/shared";

   router.post("/", validateBody(createItemSchema), createItem);
   ```

3. Use the types in the frontend, and optionally the schemas for form validation or for checking responses:

   ```ts
   import { authResponseSchema, type RegisterRequest } from "@tracker/shared";

   const body: RegisterRequest = { email, password };
   const { user } = authResponseSchema.parse(await res.json());
   ```

4. In backend tests, assert that responses match the shared response schema (see `expectAuthResponse` in `backend/tests/platform/auth/auth.test.ts`) so the API can't drift from what the frontend expects.

## How each side resolves `@tracker/shared`

| Consumer                                        | Reads                    | Rebuild needed after editing `shared/`?                                   |
| ----------------------------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| Frontend (Vite dev/build, Vitest, `tsc`)        | `shared/src` (TS source) | No                                                                        |
| Backend tests (Vitest)                          | `shared/src` (TS source) | No                                                                        |
| Backend `dev`, `build`, `lint`, editor, runtime | `shared/dist` (compiled) | Yes: run `pnpm dev` at the root, or `pnpm --filter @tracker/shared build` |

The frontend and backend tests opt into the source through the custom `@tracker/source` export condition (`frontend/vite.config.ts`, `frontend/tsconfig.app.json`, `backend/vitest.config.mts`). The backend is CommonJS and resolves through `main`/`types`, so it uses the compiled output.

Running `pnpm dev` from the repo root starts `tsc --watch` for `shared/` alongside the frontend and backend dev servers. If the backend reports a missing export from `@tracker/shared`, `shared/dist` is stale. Rebuild it as described in the table above.

## Rules

- `shared/` must stay framework-agnostic. Only `zod` (and other isomorphic libraries) may be imported there. Never import Express, Drizzle, React, or anything from `backend/` or `frontend/`.
- Everything exported from `shared/` ships to the browser, so don't put secrets or server-only logic there.
- Add dependencies to the package that imports them (`pnpm --filter @tracker/shared add <pkg>`). pnpm won't let a package import something it doesn't declare.
