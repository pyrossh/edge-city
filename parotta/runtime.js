import React, {
  Fragment, Suspense, createElement, createContext,
  useContext, useState, useEffect, useSyncExternalStore, useTransition
} from "react";

export const domain = () => typeof window !== 'undefined' ? window.origin : "http://0.0.0.0:3000";

const changedArray = (a = [], b = []) =>
  a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]))

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
export const useCache = () => {
  const [_, rerender] = useState(false);
  const ctx = useContext(RpcContext);
  const get = (k) => ctx[k]
  const set = (k, v) => {
    ctx[k] = v;
    rerender((c) => !c);
  }
  const invalidate = (regex) => {
    Object.keys(ctx)
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

export const RouterContext = createContext(undefined);

const getMatch = (radixRouter, pathname) => {
  const matchedPage = radixRouter.lookup(pathname);
  if (!matchedPage) {
    return radixRouter.lookup("/404");
  }
  return matchedPage;
}

const getCssUrl = (pathname) => `/pages${pathname === "/" ? "" : pathname}`;

export const HeadApp = ({ history, radixRouter, importMap }) => {
  const pathname = useSyncExternalStore(history.listen, (v) => v ? v.location.pathname : history.location.pathname, () => history.location.pathname);
  const match = getMatch(radixRouter, pathname);
  // const initialCss = useMemo(() => getCssUrl(history.location.pathname), []);
  return createElement(Fragment, {
    children: [
      createElement("link", {
        rel: "stylesheet",
        href: "https://unpkg.com/nprogress@0.2.0/nprogress.css",
      }),
      createElement("link", {
        id: "layoutCss",
        rel: "stylesheet",
        href: match.LayoutPath.replace("jsx", "css"),
      }),
      createElement("link", {
        id: "pageCss",
        rel: "stylesheet",
        href: getCssUrl(history.location.pathname) + "/page.css",
      }),
      createElement(Suspense, {
        children: createElement(match.Head, {}),
      }),
      createElement("script", {
        id: "importmap",
        type: "importmap",
        dangerouslySetInnerHTML: {
          __html: JSON.stringify({ "imports": importMap }),
        }
      })
    ]
  });
}

export const BodyApp = ({ nProgress, history, radixRouter, rpcCache }) => {
  const [isPending, startTransition] = useTransition();
  const [match, setMatch] = useState(() => getMatch(radixRouter, history.location.pathname));
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
      //     setMatch(getMatch(radixRouter, location.pathname));
      //   })
      // };
      // link.setAttribute("href", href);
      // document.getElementsByTagName("head")[0].appendChild(link);
      // } else {
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
  return createElement(RpcContext.Provider, {
    value: rpcCache,
    children: createElement(RouterContext.Provider, {
      value: {
        history: history,
        params: match.params || {},
      },
      children: createElement(match.Layout, {
        children: createElement(match.Body, {}),
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

export class ErrorBoundary extends React.Component {
  // static propTypes = {
  //   resetKeys: PropTypes.arrayOf(PropTypes.any),
  // }
  static getDerivedStateFromError(error) {
    return { error }
  }

  state = {}

  componentDidCatch(error, info) {
    this.props.onError?.(error, info)
  }

  componentDidUpdate(prevProps, prevState) {
    const { error } = this.state
    const { resetKeys } = this.props
    if (
      error !== null &&
      prevState.error !== null &&
      changedArray(prevProps.resetKeys, resetKeys)
    ) {
      this.setState({});
    }
  }

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;
    if (error) {
      if (React.isValidElement(fallback)) {
        return fallback;
      }
    }
    return children;
  }
}