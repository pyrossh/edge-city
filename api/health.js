export const onGet = (req) => {
  return new Response("ok", {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
  });
}