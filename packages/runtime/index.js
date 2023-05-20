import React, {
  Suspense, createContext, useContext, useState, useEffect, useTransition, useCallback
} from "react";
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment as _Fragment } from "react/jsx-runtime";
import { renderToReadableStream } from "react-dom/server";
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from "react-error-boundary";
import { createMemoryHistory } from "history";
import { createRouter } from "radix3";
import importmap from '/static/importmap.json' assert {type: 'json'};
import routemap from '/static/routemap.json' assert {type: 'json'};

/**
 * CSR related functions
 */

export const domain = () => typeof window !== 'undefined' ? window.origin : "http://0.0.0.0:3000";

export const rpc = (serviceName) => async (params = {}) => {
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

const getMatch = (radixRouter, pathname) => {
  const matchedPage = radixRouter.lookup(pathname);
  if (!matchedPage) {
    return radixRouter.lookup("_404")
  }
  return matchedPage;
}

const getCssUrl = (pathname) => `/pages${pathname === "/" ? "" : pathname}/page.css`;

export const App = ({ nProgress, history, radixRouter, rpcCache, helmetContext, PageComponent }) => {
  const [isPending, startTransition] = useTransition();
  const [match, setMatch] = useState(() => {
    if (PageComponent) {
      return PageComponent;
    }
    return getMatch(radixRouter, history.location.pathname)
  });
  useEffect(() => {
    return history.listen(({ location }) => {
      const href = getCssUrl(location.pathname);
      // const isLoaded = Array.from(document.getElementsByTagName("link"))
      //   .map((link) => link.href.replace(window.origin, "")).includes(href);
      // if (!isLoaded) {
      // const link = document.createElement('link');
      // link.setAttribute("rel", "stylesheet");
      // link.setAttribute("type", "text/css");
      // link.onload = () => {
      //   nProgress.start();
      //   startTransition(() => {
      //     setMatch(getMatch(radixRouter, location.pathname));
      //   })
      // };
      // link.setAttribute("href", href);
      // document.getElementsByTagName("head")[0].appendChild(link);
      // } else {
      const link = document.createElement('link');
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("type", "text/css");
      link.setAttribute("href", href);
      document.getElementsByTagName("head")[0].appendChild(link);
      nProgress.start();
      startTransition(() => {
        setMatch(getMatch(radixRouter, location.pathname));
      })
      // }
    });
  }, []);
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
      router.push(props.href)
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
  const url = new URL(req.url);
  const clientRouter = createRouter({
    strictTrailingSlash: true,
    routes: Object.keys(routemap).reduce((acc, r) => {
      acc[r] = React.lazy(() => import(`/pages${r}/page.jsx`));
      return acc;
    }, {}),
  });
  const history = createMemoryHistory({
    initialEntries: [url.pathname + url.search],
  });
  const helmetContext = {}
  const nProgress = { start: () => { }, done: () => { } }
  const stream = await renderToReadableStream(
    _jsxs("html", {
      lang: "en",
      children: [_jsxs("head", {
        children: [
          // _jsx("link", {
          //   rel: "stylesheet",
          //   href: "https://unpkg.com/nprogress@0.2.0/nprogress.css"
          // }),
          // _jsx("link", {
          //   id: "pageCss",
          //   rel: "stylesheet",
          //   href: `/pages${url.pathname}/page.css`
          // }),
          _jsx("script", {
            type: "importmap",
            dangerouslySetInnerHTML: {
              __html: JSON.stringify(importmap),
            }
          })]
      }), _jsxs("body", {
        children: [_jsx(App, {
          nProgress,
          history,
          radixRouter: clientRouter,
          rpcCache: {},
          helmetContext,
          PageComponent,
        }), false && _jsx(_Fragment, {
          children: _jsx("script", {
            type: "module",
            defer: true,
            dangerouslySetInnerHTML: {
              __html: `
              import React from "react";
              import { hydrateRoot } from "react-dom/client";
              import { createBrowserHistory } from "history";
              import nProgress from "nprogress";
              import { createRouter } from "radix3";
              import { App } from "parotta/runtime";
              import routemap from '/static/routemap.json' assert {type: 'json'};
              // import sheet from './styles.css' assert { type: 'css' };

              const history = createBrowserHistory();
              const radixRouter = createRouter({
                strictTrailingSlash: true,
                routes: {
                  ${Object.keys(routemap).map(r => `"${r}": React.lazy(() => import("/pages${r}/page.jsx"))`).join(',\n      ')}
                },
              });

              hydrateRoot(document.body, React.createElement(App, {
                nProgress,
                history,
                radixRouter,
                rpcCache: {},
                helmetContext: {},
                PageComponent: null,
              }));`
            }
          })
        })]
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