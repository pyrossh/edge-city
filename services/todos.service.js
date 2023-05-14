import { eq, asc } from 'drizzle-orm';
import db, { todos } from "@/db";

export const getTodos = async () => {
  return await db.select().from(todos).orderBy(asc(todos.id));
}

export const createTodo = async (item) => {
  return await db.insert(todos).values(item).returning();
}

export const getTodo = async (id) => {
  const results = await db.select().from(todos).where(eq(todos.id, id));
  return results[0]
}

export const updateTodo = async (item) => {
  return await db.update(todos).set(item).where(eq(todos.id, item.id)).returning();
}

export const deleteTodo = async (id) => {
  return await db.delete(todos).where(eq(todos.id, id)).returning();
}