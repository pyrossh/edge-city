import React, {
  Suspense, createContext, useContext, useState, useEffect, useTransition, useCallback
} from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { HelmetProvider } from 'react-helmet-async';
import { createBrowserHistory } from "history";
import { createRouter } from "radix3";
import routemap from '/routemap.json' assert {type: 'json'};

export const isProd = () => process.env.NODE_ENV === "production";
export const isClient = () => typeof window !== 'undefined';
export const domain = () => isClient() ? window.origin : "http://0.0.0.0:3000";

export const defineRpc = (serviceName) => async (params = {}) => {
  const res = await fetch(`${domain()}/_rpc/${serviceName}`, {
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

export const RouterContext = createContext(undefined);
export const RouterProvider = ({ router, history, helmetContext, App }) => {
  const [_, startTransition] = useTransition();
  const [pathname, setPathname] = useState(history.location.pathname);
  const page = router.lookup(pathname) || router.lookup("/_404");
  useEffect(() => {
    return history.listen(({ location }) => {
      // this causes 2 renders to happen but stops jitter or flash due to React.lazy
      startTransition(() => {
        setPathname(location.pathname);
      })
    });
  }, []);
  return _jsx(RouterContext.Provider, {
    value: {
      history,
      params: page.params || {},
    },
    children: _jsx(Suspense, {
      fallback: _jsx("div", {}, "Routing...."),
      children: _jsx(HelmetProvider, {
        context: helmetContext,
        children: _jsx(App, {
          children: _jsx(page, {}),
        })
      }),
    }),
  })
}

export const useRouter = () => {
  const { history, params } = useContext(RouterContext);
  return {
    pathname: history.location.pathname,
    query: new URLSearchParams(history.location.search),
    params,
    push: history.push,
    replace: history.replace,
    forward: history.forward,
    back: history.back,
    reload: () => window.location.reload(),
  };
}

export const Link = (props) => {
  const router = useRouter();
  return _jsx("a", {
    ...props,
    onMouseOver: (e) => {
      // Simple prefetching for now will work only with cache headers
      // fetch(getCssUrl(props.href));
      // fetch(getCssUrl(props.href).replace("css", "jsx"));
    },
    onClick: (e) => {
      e.preventDefault();
      if (props && props.onClick) {
        props.onClick(e);
      }
      router.push(props.href);
    },
  })
}

export const NavLink = ({ children, className, activeClassName, ...props }) => {
  const { pathname } = useRouter();
  const classNames = pathname === props.href ? [activeClassName, className] : [className];
  return _jsx(Link, {
    children,
    className: classNames,
    ...props,
  })
}

export const hydrateApp = async (App) => {
  if (!isProd()) {
    console.log("hydrating with", window._EDGE_DATA_);
  }
  const module = await import("react-dom/client");
  const history = createBrowserHistory();
  const router = createRouter({
    strictTrailingSlash: true,
    routes: Object.keys(routemap).reduce((acc, r) => {
      acc[r] = React.lazy(() => import(routemap[r]));
      return acc;
    }, {}),
  });
  const root = document.getElementById("root");
  module.default.hydrateRoot(root, _jsx(RouterProvider, {
    history,
    router,
    rpcContext: window._EDGE_DATA_ || {},
    helmetContext: {},
    App,
  }));
}