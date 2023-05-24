import React from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createMemoryHistory } from "history";
import { createRouter } from "radix3";
import { renderToReadableStream } from "react-dom/server";
import isbot from "isbot";
import routemap from '/routemap.json' assert {type: 'json'};
import { RouterProvider } from "./index";

const stringToStream = (str) => {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(str))
      controller.close()
    },
  })
}

const createTagHtmlInjectTransformer = (
  token,
  oneTime,
  inject,
) => {
  let injected = false

  return new TransformStream({
    transform(chunk, controller) {
      if (!oneTime || !injected) {
        const content = new TextDecoder().decode(chunk)
        let index
        if ((index = content.indexOf(token)) !== -1) {
          const newContent =
            content.slice(0, index) +
            inject() +
            content.slice(index, content.length)
          injected = true
          controller.enqueue(new TextEncoder().encode(newContent))
          return
        }
      }
      controller.enqueue(chunk)
    },
  })
}

const createEndHtmlInjectTransformer = (inject) => {
  return new TransformStream({
    flush(controller) {
      controller.enqueue(new TextEncoder().encode(inject()))
    },
    transform(chunk, controller) {
      controller.enqueue(chunk)
    },
  })
}

const render = async (children, {
  injectBeforeBodyClose,
  injectBeforeHeadClose,
  injectBeforeEveryScript,
  injectOnEnd,
  isSeo,
}) => {
  function transfromStream(stream) {
    let out = stream
    if (injectBeforeBodyClose) {
      out = out.pipeThrough(
        createTagHtmlInjectTransformer('</body>', true, injectBeforeBodyClose)
      )
    }
    if (injectBeforeHeadClose) {
      out = out.pipeThrough(
        createTagHtmlInjectTransformer('</head>', true, injectBeforeHeadClose)
      )
    }
    if (injectBeforeEveryScript) {
      out = out.pipeThrough(
        createTagHtmlInjectTransformer(
          '<script>',
          false,
          injectBeforeEveryScript
        )
      )
    }
    if (injectOnEnd) {
      out = out.pipeThrough(
        createEndHtmlInjectTransformer(injectOnEnd)
      )
    }
    return out;
  }

  try {
    const reactStream = await renderToReadableStream(children)
    if (isSeo) {
      await reactStream.allReady;
    }
    return transfromStream(reactStream);
  } catch (error) {
    throw error;
  }
}

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
  const stream = await render(
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
            ]
          })
        })]
    }), {
    isSeo: isbot(req.headers.get('User-Agent')) || url.search.includes("ec_is_bot=true"),
    injectBeforeHeadClose: () =>
      Object.keys(helmetContext.helmet)
        .map((k) => helmetContext.helmet[k].toString())
        .join(''),
    injectBeforeBodyClose: () => ''
      + `<script>window.__EC_RPC_DATA__ = ${JSON.stringify(rpcContext)};</script>`
      + `<script type="module" src="/js${jsScript}.js?hydrate=true"></script>`
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' },
    status: 200,
  });
}

export default renderPage;
