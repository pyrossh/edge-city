import React from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createBrowserHistory } from "history";
import { createRouter } from "radix3";
import routemap from '/routemap.json' assert {type: 'json'};

export const isProd = () => process.env.NODE_ENV === "production";
export const hydrateApp = async (App) => {
  if (!isProd()) {
    console.log("hydrating with", window._EDGE_DATA_);
  }
  const module = await import("react-dom/client");
  const history = createBrowserHistory();
  const router = createRouter({
    strictTrailingSlash: true,
    routes: Object.keys(routemap).reduce((acc, r) => {
      acc[r] = React.lazy(() => import(routemap[r]));
      return acc;
    }, {}),
  });
  const root = document.getElementById("root");
  module.default.hydrateRoot(root, _jsx(RouterProvider, {
    history,
    router,
    rpcContext: window._EDGE_DATA_ || {},
    helmetContext: {},
    App,
  }));
}