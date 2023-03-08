import React, { createContext, useContext } from 'react';

const Context = createContext(undefined)

export const RouterProvider = ({ value, children }) => {
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const json = async (body, status = 200, headers = {}) => {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    status
  });
}

// const ErrorBoundary = () => {

// }