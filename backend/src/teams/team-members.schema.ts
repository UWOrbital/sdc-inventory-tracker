import { relations } from "drizzle-orm";
import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "../users/users.schema";
import { team } from "./teams.schema";

export const teamMember = pgTable(
  "team_members",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.teamId, t.userId] }),
    index("team_members_user_id_idx").on(t.userId),
  ],
);

export type TeamMember = typeof teamMember.$inferSelect;

export const teamRelations = relations(team, ({ many }) => ({
  members: many(teamMember),
}));

export const userRelations = relations(user, ({ many }) => ({
  teams: many(teamMember),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, { fields: [teamMember.teamId], references: [team.id] }),
  user: one(user, { fields: [teamMember.userId], references: [user.id] }),
}));
