import React from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createMemoryHistory } from "history";
import { createRouter } from "radix3";
import { renderToReadableStream } from "react-dom/server";
import isbot from "isbot";
import routemap from '/routemap.json' assert {type: 'json'};
import { RouterProvider } from "./index";

const renderPage = async (Page, req) => {
  const url = new URL(req.url);
  const history = createMemoryHistory({
    initialEntries: [url.pathname + url.search],
  });
  const router = createRouter({
    strictTrailingSlash: true,
    routes: Object.keys(routemap).reduce((acc, r) => {
      acc[r] = React.lazy(() => Promise.resolve({ default: Page }));
      return acc;
    }, {}),
  });
  const jsScript = url.pathname === "/" ? "/index" : url.pathname;
  const helmetContext = {};
  const rpcContext = {};
  if (isbot(req.headers.get('User-Agent')) || url.search.includes("ec_is_bot=true")) {
    const stream = await renderToReadableStream(_jsx("body", {
      children: _jsx("div", {
        id: "root",
        children: _jsx(RouterProvider, {
          history,
          router,
          rpcCache: {},
          helmetContext,
        }),
      })
    }))
    await stream.allReady;
    let isFirstChunk = true;
    // TODO: add rpcContext
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        if (isFirstChunk) {
          isFirstChunk = false;
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`<!DOCTYPE html><html lang="en"><head>`));
          for (const key of Object.keys(helmetContext.helmet)) {
            controller.enqueue(encoder.encode(helmetContext.helmet[key].toString()));
          }
          controller.enqueue(encoder.encode(`<link rel="stylesheet" href="/css/app.css">`));
          controller.enqueue(encoder.encode(`<script type="module" src="/js${jsScript}.js?hydrate=true" defer></script>`));
          controller.enqueue(encoder.encode(`</head>`));
        }
        controller.enqueue(chunk);
      },
      flush(controller) {
        controller.enqueue(new TextEncoder().encode(`</html>`));
        controller.terminate();
      },
    });
    return new Response(stream.pipeThrough(transformStream), {
      headers: { 'Content-Type': 'text/html' },
      status: 200,
    });
  }
  const stream = await renderToReadableStream(
    _jsxs("html", {
      lang: "en",
      children: [
        _jsxs("head", {
          children: [
            _jsx("link", {
              rel: "stylesheet",
              href: "/css/app.css"
            }),
          ]
        }),
        _jsx("body", {
          children: _jsxs("div", {
            id: "root",
            children: [
              _jsx(RouterProvider, {
                history,
                router,
                rpcContext,
                helmetContext,
              }),
              _jsx(_Fragment, {
                children: _jsx("script", {
                  type: "module",
                  defer: true,
                  src: `/js${jsScript}.js?hydrate=true`,
                })
              }),
            ]
          })
        })]
    }));
  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' },
    status: 200,
  });
}

export default renderPage;
