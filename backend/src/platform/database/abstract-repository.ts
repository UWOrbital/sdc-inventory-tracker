import { and, eq, getTableColumns, isNull, SQL } from "drizzle-orm";
import { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";

import { Database } from "@/platform/database/pool";

type PgTableWithId = PgTable & { id: AnyPgColumn };
type Row<T extends PgTableWithId> = T["$inferSelect"];
type NewRow<T extends PgTableWithId> = T["$inferInsert"];
type Id<T extends PgTableWithId> = Row<T>["id"];

export default abstract class AbstractRepository<T extends PgTableWithId> {
  protected abstract readonly table: T;
  protected readonly uneditableFields: ReadonlySet<string> = new Set(["id"]);

  private get baseTable(): PgTable {
    return this.table;
  }

  constructor(protected readonly db: Database) {}

  private get name() {
    return this.constructor.name.replace("Repository", "");
  }

  private whereFrom(filters: Partial<Row<T>>): SQL | undefined {
    const columns = getTableColumns(this.table);
    const conditions = Object.entries(filters).map(([key, value]) => {
      const column = columns[key];
      if (!column) throw new Error(`${this.name}, field ${key} not found.`);
      return value === null ? isNull(column) : eq(column, value);
    });
    return and(...conditions);
  }

  async getAll(): Promise<Row<T>[]> {
    return (await this.db.select().from(this.baseTable)) as Row<T>[];
  }

  async getFirstBy(filters: Partial<Row<T>>): Promise<Row<T> | null> {
    const [row] = await this.db
      .select()
      .from(this.baseTable)
      .where(this.whereFrom(filters))
      .limit(1);
    return (row as Row<T>) ?? null;
  }

  async getAllBy(filters: Partial<Row<T>>): Promise<Row<T>[]> {
    return (await this.db.select().from(this.baseTable).where(this.whereFrom(filters))) as Row<T>[];
  }

  async getById(id: Id<T>): Promise<Row<T>> {
    const row = await this.getFirstBy({ id } as Partial<Row<T>>);
    if (!row) throw new Error(`${this.name} with ID ${id} not found.`);
    return row;
  }

  async create(data: NewRow<T>): Promise<Row<T>> {
    const [row] = await this.db.insert(this.table).values(data).returning();
    return row as Row<T>;
  }

  async deleteById(id: Id<T>): Promise<Row<T>> {
    const [row] = await this.db.delete(this.table).where(eq(this.table.id, id)).returning();
    if (!row) throw new Error(`${this.name} with ID ${id} not found.`);
    return row as Row<T>;
  }

  async update(id: Id<T>, data: Partial<NewRow<T>>): Promise<Row<T>> {
    const columns = getTableColumns(this.table);
    for (const field of Object.keys(data)) {
      if (!(field in columns)) throw new Error(`${this.name}, field ${field} not found.`);
      if (this.uneditableFields.has(field)) throw new Error(`${this.name}, field ${field} is uneditable`);
    }

    const [row] = await this.db.update(this.baseTable).set(data).where(eq(this.table.id, id)).returning();
    if (!row) throw new Error(`${this.name} with ID ${id} not found.`);
    return row as Row<T>;
  }
}
