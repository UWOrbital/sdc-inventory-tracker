# Database Migrations

We use [drizzle-kit](https://orm.drizzle.team/docs/kit-overview) to generate SQL migrations from our Drizzle schema.

- **Schema source:** every `src/**/*.schema.ts` file
- **Migrations output:** `drizzle/` (SQL files + `meta/` snapshots, commit all of it)
- **Config:** `drizzle.config.ts` (reads `DB_*` vars from `.env`)

## Scripts

| Command               | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `npm run db:generate` | Diff the schema against the last snapshot and write a new migration   |
| `npm run db:migrate`  | Apply any unapplied migrations to the database in `.env`              |
| `npm run db:push`     | Sync schema directly with no migration file (throwaway local DBs only) |
| `npm run db:studio`   | Open Drizzle Studio to browse the database                            |

## Workflow for schema changes

1. Edit (or add) a `*.schema.ts` file.
2. Generate a migration with a descriptive name:
   ```sh
   npm run db:generate -- --name add_items_table
   ```
3. Review the generated SQL in `drizzle/XXXX_<name>.sql`. Check for destructive changes (dropped columns, renames that drizzle-kit interpreted as drop + add, etc.).
4. Apply it locally:
   ```sh
   npm run db:migrate
   ```
5. Run `npm test`. The test suite spins up a fresh Postgres container and applies all migrations, so it verifies they run cleanly from scratch.
6. Commit the schema change **and** everything new in `drizzle/` together.

## Rules

- **Never edit a migration that has been merged.** Write a new one instead.
- **Don't hand-edit `drizzle/meta/`.** If a migration on your branch is wrong and hasn't been merged, delete it with `npx drizzle-kit drop` and regenerate.
- **Merge conflicts in `drizzle/`:** if two branches both added migrations, keep `main`'s version, delete your branch's migration (`npx drizzle-kit drop`), then rerun `db:generate`.
- Applied migrations are tracked in the `drizzle.__drizzle_migrations` table.

## Existing local databases

If you previously set up your local DB with `db:push`, the tables already exist but aren't recorded as migrated, so `db:migrate` will fail on `0000_init`. Simplest fix: drop and recreate the local database, then run `npm run db:migrate`.
