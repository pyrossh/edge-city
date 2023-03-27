import { useState, useMemo } from "react";

export const domain = () => typeof window !== 'undefined' ? window.origin : "http://0.0.0.0:3000";
export const globalCache = new Map();

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

const fetchData = async (route) => {
  const url = `${domain()}${route}`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  });
  if (res.ok) {
    return await res.json();
  } else {
    return new Error(await res.text());
  }
}

export const useFetch = (url) => {
  const cache = useCache();
  const value = cache.get(url);
  if (value) {
    if (value instanceof Promise) {
      throw value;
    } else if (value instanceof Error) {
      throw value;
    }
    return { data: value, cache };
  }
  cache.set(url, fetchData(url).then((v) => cache.set(url, v)));
  throw cache.get(url);
}