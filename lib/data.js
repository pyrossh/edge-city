import { useState, useEffect, useCallback } from "react";

export const defineRpc = (serviceName) => async (params = {}) => {
  const res = await fetch(`/_rpc/${serviceName}`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })
  return await res.json();
}


export const cache = {
  get: (k) => globalThis._EDGE_DATA_.data[k],
  set: (k, v) => {
    globalThis._EDGE_DATA_.data[k] = v;
  },
  invalidate: (k, setRefetch) => Promise.all(Array.from(globalThis._EDGE_DATA_.subs[k]).map((cb) => cb(setRefetch))),
  subscribe: (k, cb) => {
    if (!globalThis._EDGE_DATA_.subs[k]) {
      globalThis._EDGE_DATA_.subs[k] = new Set();
    }
    globalThis._EDGE_DATA_.subs[k].add(cb)
    return () => globalThis._EDGE_DATA_.subs[k].delete(cb);
  }
}

/**
 * 
 * @param {*} fn
 * @param {*} params 
 * @returns 
 */
export const useQuery = (key, fn) => {
  const [, toggle] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [err, setErr] = useState(null);
  const refetch = useCallback(async (setRefetch = true) => {
    try {
      if (setRefetch) {
        setIsRefetching(true);
      }
      setErr(null);
      cache.set(key, await fn());
    } catch (err) {
      setErr(err);
      throw err;
    } finally {
      if (setRefetch) {
        setIsRefetching(false);
      } else {
        toggle((v) => !v);
      }
    }
  }, [fn]);
  useEffect(() => {
    return cache.subscribe(key, refetch);
  }, [key])
  const value = cache.get(key);
  if (value) {
    if (value instanceof Promise) {
      throw value;
    } else if (value instanceof Error) {
      throw value;
    }
    return { data: value, isRefetching, err, refetch };
  }
  cache.set(key, fn().then((v) => cache.set(key, v)));
  throw cache.get(key);
}

export const useMutation = (fn) => {
  const [isMutating, setIsMutating] = useState(false);
  const [err, setErr] = useState(null);
  const mutate = useCallback(async (params) => {
    try {
      setIsMutating(true);
      setErr(null);
      await fn(params);
    } catch (err) {
      setErr(err)
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [fn])
  return {
    mutate,
    isMutating,
    err,
  }
}