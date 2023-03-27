import React, { createContext, useContext, useState, useEffect, useMemo, useSyncExternalStore } from "react";
import nProgress from "nprogress";

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

export const Router = ({ App, history, radixRouter }) => {
  const [isPending, startTransition] = React.useTransition();
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
  }, []);
  useEffect(() => {
    if (!isPending) {
      nProgress.done();
    }
  }, [isPending])
  console.log('Router', isPending);
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
    onMouseOver: (e) => {
      // Simple prefetching for now will work only with cache headers
      fetch(getCssUrl(props.href));
      fetch(getCssUrl(props.href).replace("css", "jsx"));
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