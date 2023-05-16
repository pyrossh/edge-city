import React, {
  Suspense, createElement, createContext, useContext, useState, useEffect, useTransition, useCallback
} from "react";
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from "react-error-boundary";

export const domain = () => typeof window !== 'undefined' ? window.origin : "http://0.0.0.0:3000";

export const rpc = (serviceName) => async (params = {}) => {
  console.log('serviceName', serviceName);
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
// const invalidate = (regex) => {
//   Object.keys(ctx)
//     .filter((k) => regex.test(k))
//     .forEach((k) => {
//       fetchData(k).then((v) => set(k, v));
//     });
// }

export const useCache = (k) => {
  const ctx = useContext(RpcContext);
  const [_, rerender] = useState(false);
  const get = () => ctx[k]
  const set = (v) => {
    ctx[k] = v;
    rerender((c) => !c);
  }
  const invalidate = () => {
    ctx[k] = undefined;
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
export const useRpc = (fn, params) => {
  const [isRefetching, setIsRefetching] = useState(false);
  const [err, setErr] = useState(null);
  const key = `${fn.name}:${JSON.stringify(params)}`;
  const cache = useCache(key);
  const refetch = useCallback(async () => {
    try {
      setIsRefetching(true);
      setErr(null);
      cache.set(await fn(params));
    } catch (err) {
      setErr(err);
      throw err;
    } finally {
      setIsRefetching(false);
    }
  }, [key])
  const value = cache.get();
  if (value) {
    if (value instanceof Promise) {
      throw value;
    } else if (value instanceof Error) {
      throw value;
    }
    return { data: value, isRefetching, err, refetch };
  }
  cache.set(fn(params).then((v) => cache.set(v)));
  throw cache.get();
}

export const RouterContext = createContext(undefined);

const getMatch = (radixRouter, pathname) => {
  const matchedPage = radixRouter.lookup(pathname);
  if (!matchedPage) {
    return React.lazy(() => import("/pages/_404/page.jsx"));
  }
  return matchedPage;
}

const getCssUrl = (pathname) => `/pages${pathname === "/" ? "" : pathname}/page.css`;

export const App = ({ nProgress, history, radixRouter, rpcCache, helmetContext }) => {
  const [isPending, startTransition] = useTransition();
  const [match, setMatch] = useState(() => getMatch(radixRouter, history.location.pathname));
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
  return createElement(HelmetProvider, {
    context: helmetContext,
    children: createElement(RpcContext.Provider, {
      value: rpcCache,
      children: createElement(RouterContext.Provider, {
        value: {
          history: history,
          params: match.params || {},
        },
        children: createElement(ErrorBoundary, {
          onError: (err) => console.log(err),
          fallback: createElement("p", {}, "Oops something went wrong"),
          children: createElement(Suspense, {
            fallback: createElement("p", {}, "Loading..."),
            children: createElement(match, {}),
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
  return createElement("a", {
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
  return createElement(Link, {
    children,
    className: classNames,
    ...props,
  })
}