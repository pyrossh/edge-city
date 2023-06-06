import {
  useState, useEffect, useTransition
} from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";

export let state = {
  get: () => globalThis._EDGE_ROUTER_STATE_,
  set: (v) => {
    globalThis._EDGE_ROUTER_STATE_ = v;
  },
}

export const usePage = () => {
  const { history, router } = state.get();
  const [_, startTransition] = useTransition();
  const [pathname, setPathname] = useState(history.location.pathname);
  const Page = router.lookup(pathname) || router.lookup("/_404");
  useEffect(() => {
    return history.listen(({ location }) => {
      // this causes 2 renders to happen but stops jitter or flash due to React.lazy
      startTransition(() => {
        setPathname(location.pathname);
      })
    });
  }, []);
  return Page;
}

export const useRouter = () => {
  const { history, params } = state.get();
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