import { todosCollection } from "@/services/collections";

const getId = (req) => {
  const url = new URL(req.url);
  const res = new RegExp("/todos/(.*?)$").exec(url.pathname)
  return res[1];
}

export const onGet = async (req) => {
  const id = getId(req);
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
  const data = JSON.stringify(updated);
  return new Response(data, {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}

export const onDelete = async (req) => {
  const id = getId(req);
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