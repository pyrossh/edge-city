export const renderApi = async (fn, req) => {
  const url = new URL(req.url);
  const params = req.method === "POST" ? await req.json() : Object.fromEntries(url.searchParams);
  try {
    const result = await fn(params);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.log("err: renderApi", err);
    const message = err.format ? err.format() : err.message;
    const data = process.env.NODE_ENV === "development" ? { message, stack: err.stack } : { message };
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}

export default renderApi;