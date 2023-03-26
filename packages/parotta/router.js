import React, { createContext, useContext, useState, useEffect, useMemo, useSyncExternalStore } from "react";
import nProgress from "nprogress";

export const isClient = () => typeof window !== 'undefined';
export const domain = () => isClient() ? window.origin : "http://0.0.0.0:3000";
export const basePath = () => isClient() ? "" : process.cwd();
export const globalCache = new Map();
export const useFetchCache = () => {
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
  console.log('url', url);
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
  const cache = useFetchCache();
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

export const RouterContext = createContext(undefined);

const getMatch = (radixRouter, pathname) => {
  const matchedPage = radixRouter.lookup(pathname);
  if (!matchedPage) {
    return radixRouter.lookup("/404");
  }
  return matchedPage;
}

const getCssUrl = (pathname) => `/routes${pathname === "/" ? "/page.css" : pathname + "/page.css"}`;

export const Header = ({ history, radixRouter, importMap }) => {
  const pathname = useSyncExternalStore(history.listen, (v) => v ? v.location.pathname : history.location.pathname, () => history.location.pathname);
  const match = getMatch(radixRouter, pathname);
  const initialCss = useMemo(() => getCssUrl(history.location.pathname), []);
  return React.createElement(React.Fragment, {
    children: [
      React.createElement("link", {
        rel: "stylesheet",
        href: "https://unpkg.com/nprogress@0.2.0/nprogress.css",
      }),
      React.createElement("link", {
        rel: "stylesheet",
        href: initialCss,
      }),
      React.createElement(React.Suspense, {
        children: React.createElement(match.Head, {}),
      }),
      React.createElement("script", {
        id: "importmap",
        type: "importmap",
        dangerouslySetInnerHTML: {
          __html: JSON.stringify({ "imports": importMap }),
        }
      })
    ]
  });
}

// export const PP = ({ children }) => {
//   React.useEffect(() => {
//     nProgress.done()
//     return () => {
//       nProgress.start();
//     }
//   }, []);
//   return children
// }

export const Router = ({ App, history, radixRouter }) => {
  const [, startTransition] = React.useTransition();
  const [match, setMatch] = useState(() => getMatch(radixRouter, history.location.pathname));
  useEffect(() => {
    return history.listen(({ location }) => {
      const href = getCssUrl(location.pathname);
      const isLoaded = Array.from(document.getElementsByTagName("link"))
        .map((link) => link.href.replace(window.origin, "")).includes(href);
      if (!isLoaded) {
        const link = document.createElement('link');
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.onload = () => {
          nProgress.start();
          startTransition(() => {
            setMatch(getMatch(radixRouter, location.pathname));
          })
        };
        link.setAttribute("href", href);
        document.getElementsByTagName("head")[0].appendChild(link);
      } else {
        nProgress.start();
        startTransition(() => {
          setMatch(getMatch(radixRouter, location.pathname));
        })
      }
    });
  }, [])
  console.log('Router');
  return React.createElement(RouterContext.Provider, {
    value: {
      history: history,
      params: match.params || {},
    },
    children: React.createElement(App, {
      children: React.createElement(match.Page, {}),
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
  return React.createElement("a", {
    ...props,
    // onMouseOver: (e) => {
    //   fetch(`/routes${pathname === "/" ? "" : pathname}/page.css`);
    //   fetch(`/routes${pathname === "/" ? "" : pathname}/page.jsx`);
    // },
    onClick: (e) => {
      e.preventDefault();
      if (props && props.onClick) {
        props.onClick(e);
      }
      router.push(props.href)
    },
  })
}