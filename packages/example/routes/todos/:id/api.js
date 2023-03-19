import tigrisDB from "./db.js.js.js.js.js.js.js.js";

export const todosCollection = tigrisDB.getCollection("todoItems");

export const onGet = async (req) => {
  const { id } = req.params;
  const item = await todosCollection.findOne({
    filter: { id },
  });
  const data = JSON.stringify(item);
  return new Response(data, {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}

export const onPut = async (req) => {
  const item = await req.body();
  const updated = await todosCollection.insertOrReplaceOne(item);
  const data = JSON.stringify(updated);``
  return new Response(data, {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}

export const onDelete = async (req) => {
  const { id } = req.params;
  const res = await todosCollection.deleteOne({
    filter: { id },
  });
  const data = JSON.stringify(res);
  return new Response(data, {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}