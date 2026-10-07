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

# Database Schema

```dbml
Enum account_status {
  pending
  active
  inactive
}

Enum account_role {
  member
  admin
  superuser
}

Enum image_status {
  pending
  uploaded
  failed
  deleted
}

table users {
  id uuid [pk]
  team_id uuid [not null]
  avatar_id uuid [not null, unique]
  status account_status
  role account_role
  email text
  password_hash text
  name text
  updated_at timestamptz
  created_at timestamptz
}

table teams {
  id uuid [pk]
  name text
  slug text [unique]
  description text
  updated_at timestamptz
  created_at timestamptz
}

table join_requests {
  id uuid [pk]
  user_id uuid [not null, unique]
  team_id uuid [not null]
  updated_at timestamptz
  created_at timestamptz
}

table items {
  id uuid [pk]
  team_id uuid [not null]
  image_id uuid [not null, unique]
  created_by uuid [not null]
  last_updated_by uuid [not null]
  name text
  description text
  count integer
  updated_at timestamptz
  created_at timestamptz
}

table signouts {
  id uuid [pk]
  item_id uuid [not null]
  user_id uuid [not null]
  quantity integer
  returned_at timestamptz
  updated_at timestamptz
  created_at timestamptz
}

Table images {
  id uuid [pk]

  user_id uuid [not null]
  team_id uuid [not null]
  bucket_name text [not null]
  object_key text [not null]
  etag text

  original_filename text
  content_type text [not null]
  size_bytes bigint [not null]
  checksum_sha256 text
  width integer
  height integer

  status image_status [not null]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
  deleted_at timestamptz

  indexes {
    (bucket_name, object_key) [unique]
    status
    created_at
  }
}


Ref: "teams"."id" < "users"."team_id"

Ref: "join_requests"."user_id" - "users"."id"

Ref: "teams"."id" < "join_requests"."team_id"

Ref: "items"."image_id" - "images"."id"

Ref: "teams"."id" < "items"."team_id"

Ref: "items"."id" < "signouts"."item_id"

Ref: "users"."id" < "signouts"."user_id"

Ref: "users"."avatar_id" - "images"."id"

Ref: "users"."id" < "items"."created_by"

Ref: "users"."id" < "items"."last_updated_by"

Ref: "users"."id" <? "images"."user_id"

Ref: "teams"."id" <? "images"."team_id"
```
