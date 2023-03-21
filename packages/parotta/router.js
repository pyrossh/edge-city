import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { createRouter } from 'radix3';

export const RouterContext = createContext({
  stack: [],
  state: {
    pathname: "",
    query: {},
    params: {},
  }
});

const getBasePath = () => typeof window !== "undefined" ? "" : process.cwd();

export const RouterProvider = ({ value, children }) => {
  const [path, setPath] = useState(value.state.pathname);
  const [state, setState] = useState(value.state);
  const [Page, setPage] = useState();
  const radixRouter = useMemo(() => createRouter({
    strictTrailingSlash: true,
    routes: value.routes,
  }), [])
  useEffect(() => {
    window.addEventListener('popstate', function (event) {
      setPath(location.pathname);
    }, false);
  }, [])
  useEffect(() => {
    if (path !== value.state.pathname) {
      let match = radixRouter.lookup(path)
      if (!match) {
        match = { page: '/404.jsx' }
        console.log('route not matched');
      } else {
        console.log('route match', match, `${getBasePath()}/routes${match.page}`);
      }
      import(`${getBasePath()}/routes${match.page}`)
        .then((comp) => {
          setState({ pathname: path, params: match.params, query: {} });
          setPage(comp.default);
        })
    } else {
      setState(value.state);
      setPage(null);
    }
  }, [path])
  return React.createElement(RouterContext.Provider, {
    value: {
      stack: [],
      state,
      setPath,
    },
    children: Page || children,
  });
}

export const useRouter = () => {
  const ctx = useContext(RouterContext);
  return {
    ...ctx.state,
    push: (path) => {
    },
    replace: (path) => {
    },
    prefetch: () => {
    },
    beforePopState: () => {
    },
    back: () => {
    },
    reload: () => window.location.reload(),
  };
}

export const Link = (props) => {
  const ctx = useContext(RouterContext);

  return React.createElement("a", {
    ...props,
    onClick: (e) => {
      e.preventDefault();
      if (props && props.onClick) {
        props.onClick(e);
      }
      history.pushState({}, "", props.href);
      ctx.setPath(props.href)
    },
  })
}