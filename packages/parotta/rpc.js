import { useState, useMemo } from "react";

export const domain = () => typeof window !== 'undefined' ? window.origin : "http://0.0.0.0:3000";
export const globalCache = new Map();

const rpc = (serviceName) => async (params = {}) => {
  const res = await fetch(`${domain()}/services/${serviceName}`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })
  return await res.json();
}

export const useCache = () => {
  const [_, rerender] = useState(false);
  const cache = useMemo(() => globalCache, []);
  const get = (k) => cache.get(k)
  const set = (k, v) => {
    cache.set(k, v);
    rerender((c) => !c);
  }
  const invalidate = (regex) => {
    Array.from(cache.keys())
      .filter((k) => regex.test(k))
      .forEach((k) => {
        fetchData(k).then((v) => set(k, v));
      });
  }
  return {
    get,
    set,
    invalidate,
  }
}

export const useRpc = (fn, params) => {
  const cache = useCache();
  const key = `${fn.name}:${JSON.stringify(params)}`;
  const value = cache.get(key);
  if (value) {
    if (value instanceof Promise) {
      throw value;
    } else if (value instanceof Error) {
      throw value;
    }
    return { data: value, cache };
  }
  cache.set(key, fn(params).then((v) => cache.set(key, v)));
  throw cache.get(key);
}

export default rpc;