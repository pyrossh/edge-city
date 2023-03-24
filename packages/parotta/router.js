import React, { createContext, useContext, useState, useEffect } from "react";

export const RouterContext = createContext(undefined);

const getRoute = (radixRouter, pathname) => {
  const matchedPage = radixRouter.lookup(pathname);
  if (!matchedPage) {
    return radixRouter.lookup("/404");
  }
  return matchedPage;
}

export const Router = ({ App, history, radixRouter }) => {
  const [Page, setPage] = useState(() => getRoute(radixRouter, history.location.pathname));
  useEffect(() => {
    return history.listen(({ location }) => setPage(getRoute(radixRouter, location.pathname)));
  }, [])
  console.log('Router');
  return React.createElement(RouterContext.Provider, {
    value: history,
    children: React.createElement(App, {
      children: React.createElement(Page, {})
    }),
  });
}

export const useRouter = () => {
  const history = useContext(RouterContext);
  return {
    pathname: history.location.pathname,
    query: {},
    params: {},
    push: (path) => {
      history.push(path)
    },
    replace: (path) => {
      history.replace(path)
    },
    forward: () => {
      history.forward();
    },
    back: () => {
      history.back();
    },
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