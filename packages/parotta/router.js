import React, { createContext, useContext } from "react";

export const RouterContext = createContext({
  stack: [],
  state: {
    pathname: "",
    query: {},
    params: {},
  }
});

export const RouterProvider = ({ value, children }) => {
  return React.createElement(RouterContext.Provider, {
    value: {
      stack: [],
      state: value,
    },
    children,
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