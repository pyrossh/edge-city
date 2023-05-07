import { gt, eq } from 'drizzle-orm';
import { db, todos } from "@/db";

export const onGet = async (req) => {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const results = await db.select().from(todos).where(gt(todos.id, 0)).limit(page * 5).offset((page - 1) * 5);
  return new Response(JSON.stringify(results), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}

export const onPost = async (req) => {
  const body = await req.body();
  const input = JSON.parse(body);
  const data = await db.insert(todos).values(input).returning();
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}

export const onPatch = async (req) => {
  const body = await req.body();
  const input = JSON.parse(body);
  const data = await db.update(todos).set(input).where(eq(todos.id, input.id)).returning();
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}

export const onDelete = async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const data = await db.delete(todos).where(eq(todos.id, id)).returning();
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}