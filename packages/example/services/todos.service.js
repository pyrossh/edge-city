import { eq, asc } from 'drizzle-orm';
import db from "@/db";
import { boolean, date, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';

const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  completed: boolean('completed').notNull(),
  createdAt: date('createdAt').notNull(),
  updatedAt: date('updatedAt'),
});

export const createSchema = z.object({
  text: z.string().nonempty("please enter some text"),
  completed: z.boolean(),
});

export const updateSchema = z.object({
  text: z.string().nonempty("please enter some text"),
  completed: z.boolean(),
});

export const getTodos = async () => {
  return await db.select().from(todos).orderBy(asc(todos.id));
}

/** @param {z.infer<typeof createSchema>} params */
export const createTodo = async (params) => {
  const item = createSchema.parse(params);
  item.createdAt = new Date();
  return await db.insert(todos).values(item).returning();
}

export const getTodo = async (id) => {
  const results = await db.select().from(todos).where(eq(todos.id, id));
  return results[0]
}

/** @param {z.infer<typeof updateSchema>} params */
export const updateTodo = async (params) => {
  const item = updateSchema.parse(params);
  item.updatedAt = new Date();
  return await db.update(todos).set(item).where(eq(todos.id, item.id)).returning();
}

export const deleteTodo = async (id) => {
  return await db.delete(todos).where(eq(todos.id, id)).returning();
}