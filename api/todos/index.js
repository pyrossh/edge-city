import tigrisDB from "./db.js";

export const todosCollection = tigrisDB.getCollection("todoItems");

export const onGet = async (req) => {
  const cursor = todosCollection.findMany({});
  const items = await cursor.toArray();
  const data = JSON.stringify(items);
  return new Response(data, {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}

export const onPost = async (req) => {
  const body = await req.body();
  const item = JSON.parse(body);
  const inserted = await todosCollection.insertOne(item);
  const data = JSON.stringify(inserted);
  return new Response(data, {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}