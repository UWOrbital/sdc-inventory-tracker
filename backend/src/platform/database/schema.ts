import * as teamMembers from "@/teams/team-members.schema";
import * as teams from "@/teams/teams.schema";
import * as users from "@/users/users.schema";

export const schema = { ...users, ...teams, ...teamMembers };
