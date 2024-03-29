import { eq, desc } from "drizzle-orm";
import { boolean, date, pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod";

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").notNull(),
  createdAt: date("createdAt").notNull(),
  updatedAt: date("updatedAt"),
});

export const createSchema = z.object({
  text: z.string().nonempty("please enter some text"),
  completed: z.boolean(),
});

const updateSchema = z.object({
  id: z.number().positive().int("must be an integer"),
  text: z.string().nonempty("please enter some text"),
  completed: z.boolean(),
});

export const getTodos = async () => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 2000)
  });
  return await db.select().from(todos).orderBy(desc(todos.id));
};

/** @param {z.infer<typeof createSchema>} params */
export const createTodo = async (params) => {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 2000)
  });
  const item = createSchema.parse(params);
  item.createdAt = new Date();
  return await db.insert(todos).values(item).returning();
};

export const getTodo = async (id) => {
  const results = await db.select().from(todos).where(eq(todos.id, id));
  return results[0];
};

/** @param {z.infer<typeof updateSchema>} params */
export const updateTodo = async (params) => {
  const item = updateSchema.parse(params);
  item.updatedAt = new Date();
  return await db.update(todos).set(item).where(eq(todos.id, item.id)).returning();
};

export const deleteTodo = async (id) => {
  return await db.delete(todos).where(eq(todos.id, id)).returning();
};
