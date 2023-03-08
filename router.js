import { createContext, useContext } from 'react';

const Context = createContext(undefined)

export const RouterProvider = ({ value, children }) => {
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useRouter = () => {
  const state = useContext(Context);
  return {
    query: state.query,
    pathname: state.pathname,
    params: state.params,
    push: () => {
    },
    replace: () => {
    },
    prefetch: () => {
    },
    beforePopState: () => {
    },
    back: () => { },
    reload: () => window.location.reload(),
  }
}