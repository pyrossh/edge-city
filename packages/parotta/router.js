import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export const isClient = () => typeof window !== 'undefined';
export const domain = () => isClient() ? window.origin : "http://0.0.0.0:3000";
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

const loadCss = (pathname) => {
  const href = `/routes${pathname === "/" ? "" : pathname}/page.css`;
  const isLoaded = Array.from(document.getElementsByTagName("link"))
    .map((link) => link.href.replace(window.origin, "")).includes(href);
  if (!isLoaded) {
    const fileref = document.createElement("link");
    fileref.rel = "stylesheet";
    fileref.type = "text/css";
    fileref.href = href;
    document.getElementsByTagName("head")[0].appendChild(fileref);
  }
}

export const Router = ({ App, history, radixRouter }) => {
  const [MatchedPage, setMatchedPage] = useState(() => getMatch(radixRouter, history.location.pathname));
  useEffect(() => {
    return history.listen(({ location }) => {
      loadCss(location.pathname);
      setMatchedPage(getMatch(radixRouter, location.pathname));
    });
  }, [])
  console.log('Router');
  return React.createElement(RouterContext.Provider, {
    value: {
      history: history,
      params: MatchedPage.params || {},
    },
    children: React.createElement(App, {
      children: React.createElement(MatchedPage, {})
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
    onClick: (e) => {
      e.preventDefault();
      if (props && props.onClick) {
        props.onClick(e);
      }
      router.push(props.href);
    },
  })
}