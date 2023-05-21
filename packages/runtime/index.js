import React, {
  Suspense, createContext, useContext, useState, useEffect, useTransition, useCallback
} from "react";
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment as _Fragment } from "react/jsx-runtime";
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from "react-error-boundary";
import { createMemoryHistory, createBrowserHistory } from "history";
import { createRouter } from "radix3";
import nProgress from "nprogress";
import importmap from '/importmap.json' assert {type: 'json'};
import routemap from '/routemap.json' assert {type: 'json'};

/**
 * CSR related functions
 */

export const isClient = () => typeof window !== 'undefined';
export const domain = () => isClient() ? window.origin : "http://0.0.0.0:3000";

export const rpc = (serviceName) => async (params = {}) => {
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

export const RpcContext = createContext(undefined);

// global way to refresh maybe without being tied to a hook like refetch
export const useInvalidate = () => {
  const ctx = useContext(RpcContext);
  return (regex) => {
    Object.keys(ctx)
      .filter((k) => regex.test(k))
      .forEach((k) => {
        delete ctx[k];
      });
  }
}

export const useRpcCache = (k) => {
  const ctx = useContext(RpcContext);
  const [_, rerender] = useState(false);
  const get = () => ctx[k]
  const set = (v) => {
    ctx[k] = v;
    rerender((c) => !c);
  }
  const invalidate = () => {
    delete ctx[k];
    rerender((c) => !c);
  }
  return {
    get,
    set,
    invalidate,
  }
}

/**
 * 
 * @param {*} fn
 * @param {*} params 
 * @returns 
 */
export const useQuery = (key, fn) => {
  const [isRefetching, setIsRefetching] = useState(false);
  const [err, setErr] = useState(null);
  const cache = useRpcCache(key);
  const refetch = useCallback(async () => {
    try {
      setIsRefetching(true);
      setErr(null);
      cache.set(await fn());
    } catch (err) {
      setErr(err);
      throw err;
    } finally {
      setIsRefetching(false);
    }
  }, [fn]);
  const value = cache.get();
  if (value) {
    if (value instanceof Promise) {
      throw value;
    } else if (value instanceof Error) {
      throw value;
    }
    return { data: value, isRefetching, err, refetch };
  }
  cache.set(fn().then((v) => cache.set(v)));
  throw cache.get();
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

const getMatch = (router, pathname) => {
  const matchedPage = router.lookup(pathname);
  if (!matchedPage) {
    return router.lookup("/js/_404.js")
  }
  return matchedPage;
}

const getCssUrl = (pathname) => `/pages${pathname === "/" ? "" : pathname}/page.css`;

export const App = ({ nProgress, history, router, rpcCache, helmetContext, PageComponent }) => {
  const [isPending, startTransition] = useTransition();
  const [match, setMatch] = useState(() => {
    if (PageComponent) {
      return PageComponent;
    }
    return getMatch(router, history.location.pathname)
  });
  useEffect(() => {
    return history.listen(({ location }) => {
      // const href = getCssUrl(location.pathname);
      // const isLoaded = Array.from(document.getElementsByTagName("link"))
      //   .map((link) => link.href.replace(window.origin, "")).includes(href);
      // if (!isLoaded) {
      // const link = document.createElement('link');
      // link.setAttribute("rel", "stylesheet");
      // link.setAttribute("type", "text/css");
      // link.onload = () => {
      //   nProgress.start();
      //   startTransition(() => {
      //     setMatch(getMatch(router, location.pathname));
      //   })
      // };
      // link.setAttribute("href", href);
      // document.getElementsByTagName("head")[0].appendChild(link);
      // } else {
      // const link = document.createElement('link');
      // link.setAttribute("rel", "stylesheet");
      // link.setAttribute("type", "text/css");
      // link.setAttribute("href", href);
      // document.getElementsByTagName("head")[0].appendChild(link);
      nProgress.start();
      startTransition(() => {
        setMatch(getMatch(router, location.pathname));
      })
      // }
    });
  }, []);
  console.log("match", match)
  useEffect(() => {
    if (!isPending) {
      nProgress.done();
    }
  }, [isPending]);
  return _jsx(HelmetProvider, {
    context: helmetContext,
    children: _jsx(RpcContext.Provider, {
      value: rpcCache,
      children: _jsx(RouterContext.Provider, {
        value: {
          history: history,
          params: match.params || {},
        },
        children: _jsx(ErrorBoundary, {
          onError: (err) => console.log(err),
          fallback: _jsx("p", {}, "Oops something went wrong"),
          children: _jsx(Suspense, {
            fallback: _jsx("p", {}, "Loading..."),
            children: _jsx(match, {}),
          }),
        }),
      }),
    }),
  });
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

/**
 * SSR related functions
 */
export const renderPage = async (PageComponent, req) => {
  const { renderToReadableStream } = await import("react-dom/server");
  const url = new URL(req.url);
  const history = createMemoryHistory({
    initialEntries: [url.pathname + url.search],
  });
  const jsScript = url.pathname === "/" ? "index" : url.pathname;
  const helmetContext = {}
  const stream = await renderToReadableStream(
    _jsxs("html", {
      lang: "en",
      children: [_jsxs("head", {
        children: [
          _jsx("link", {
            rel: "stylesheet",
            href: "/css/app.css"
          }),
          _jsx("script", {
            type: "importmap",
            dangerouslySetInnerHTML: {
              __html: JSON.stringify(importmap),
            }
          })]
      }), _jsx("body", {
        children: _jsxs("div", {
          id: "root",
          children: [_jsx(App, {
            nProgress,
            history,
            router: null,
            rpcCache: {},
            helmetContext,
            PageComponent,
          }), _jsx(_Fragment, {
            children: _jsx("script", {
              type: "module",
              defer: true,
              src: `/js/${jsScript}.js?hydrate=true`,
            })
          })]
        })
      })]
    }));
  // TODO:
  // if (bot || isCrawler) {
  //  await stream.allReady
  //  add helmetContext to head
  // }
  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' },
    status: 200,
  });
}

export const hydrateApp = async (Page) => {
  console.log("hydrating");
  const { hydrateRoot } = await import("react-dom/client");
  const history = createBrowserHistory();
  const router = createRouter({
    strictTrailingSlash: true,
    routes: Object.keys(routemap).reduce((acc, r) => {
      acc[r] = React.lazy(() => import(routemap[r]));
      return acc;
    }, {}),
  });
  const root = document.getElementById("root");
  hydrateRoot(root, React.createElement(App, {
    nProgress,
    history,
    router,
    rpcCache: {},
    helmetContext: {},
    PageComponent: Page,
  }));
}