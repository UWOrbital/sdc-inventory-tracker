import AbstractRepository from "@/platform/database/abstract-repository";
import { user } from "@/users/users.schema";

export class UserRepository extends AbstractRepository<typeof user> {
  protected readonly table = user;
  protected readonly uneditableFields: ReadonlySet<string> = new Set(["id", "email", "createdAt"]);

  override async getAll() {
    return await this.db.select().from(user).orderBy(user.createdAt);
  }
}
