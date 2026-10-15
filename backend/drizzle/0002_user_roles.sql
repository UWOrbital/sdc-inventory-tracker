CREATE TYPE "public"."user_role" AS ENUM('member', 'admin', 'superuser');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'member' NOT NULL;