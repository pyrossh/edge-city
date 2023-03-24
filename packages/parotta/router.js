import React, { createContext, useContext, useState, useEffect } from "react";

export const RouterContext = createContext(undefined);

export const Router = ({ App, history, radixRouter }) => {
  const [Page, setPage] = useState(radixRouter.lookup(history.location.pathname));
  useEffect(() => {
    return history.listen(({ action, location }) => {
      const matchedPage = radixRouter.lookup(location.pathname);
      if (!matchedPage) {
        matchedPage = '/404.jsx';
        console.log('route not matched');
        setPage(() => <h1> Not found</h1>);
      } else {
        console.log('route match', matchedPage);
        setPage(matchedPage);
      }
    });
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