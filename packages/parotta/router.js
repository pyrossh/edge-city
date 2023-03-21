import { createContext, useContext } from "react";

export const RouterContext = createContext({
  stack: [],
  state: {
    pathname: "",
    query: {},
    params: {},
  }
});

export const RouterProvider = ({ value, children }) => {
  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  )
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