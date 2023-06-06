import React from "react";
import { hydrateRoot } from "react-dom/client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createBrowserHistory } from "history";
import { createRouter } from "radix3";
import { state } from "./router";
import routemap from '/routemap.json' assert {type: 'json'};

const hydratePage = (App) => {
  const history = createBrowserHistory();
  const router = createRouter({
    strictTrailingSlash: true,
    routes: Object.keys(routemap).reduce((acc, r) => {
      acc[r] = React.lazy(() => import(routemap[r]));
      return acc;
    }, {}),
  });
  state.set({
    router,
    history,
    helmetContext: {},
  })
  const root = document.getElementById("root");
  hydrateRoot(root, _jsx(App, { helmetContext: {} }));
}

export default hydratePage;