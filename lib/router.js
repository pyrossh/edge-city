import {
  Suspense, createContext, useContext, useState, useEffect, useTransition, useCallback
} from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { HelmetProvider } from 'react-helmet-async';

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