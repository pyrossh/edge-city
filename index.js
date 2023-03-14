import './jsxPlugin.js';
import path from 'path';
import { SWRConfig } from 'swr';
import { renderToReadableStream } from 'react-dom/server';
import { RouterProvider } from './router.js';
import packageJson from "./package.json";

const transpiler = new Bun.Transpiler({
  loader: "jsx",
  autoImportJSX: true,
  jsxOptimizationInline: true,
});

const renderApi = async (route, req) => {
  const routeImport = await import(route.filePath);
  console.log('routeImport', routeImport);
}

const deps = Object.keys(packageJson.dependencies).reduce((acc, dep) => {
  acc[dep] = `https://esm.sh/${dep}@${packageJson.dependencies[dep]}?dev`;
  return acc;
}, {})

const renderPage = async (filePath, url, params) => {
  const query = {};
  for (const key of url.searchParams.keys()) {
    query[key] = url.searchParams.get(key);
  }
  const initialRouteValue = {
    query: query,
    params: params,
    pathname: url.pathname,
  }
  console.log('filePath', filePath);
  const routeImport = await import(filePath);
  const Page = routeImport.default;
  const stream = await renderToReadableStream(
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/pages/index.css" />
        <script id="initial_route_context" type='application/json' dangerouslySetInnerHTML={{
          __html: JSON.stringify(initialRouteValue)
        }} />
        <script type="importmap" dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            {
              "imports": {
                ...deps,
                "react-dom/client": "https://esm.sh/react-dom@18.2.0/client?dev",
                "react/jsx-dev-runtime": "https://esm.sh/react@18.2.0/jsx-dev-runtime?dev",
                "@/router.js": "/assets/js/src/router.js",
                "@/pages/index.jsx": "/pages/index.js",
                "@/components/Todo.jsx": "/components/Todo.js",
                "@/containers/TodoList.jsx": "/containers/TodoList.js"
              }
            }
          )
        }}>
        </script>
        <script type="module" defer dangerouslySetInnerHTML={{
          __html: `
          import* as JSX from "react/jsx-dev-runtime";
          var $jsx = JSX.jsxDEV;
          import { hydrateRoot } from 'react-dom/client';
          import { SWRConfig } from 'swr';
          import {RouterProvider} from "@/router.js";
          import Page from "@/pages/index.jsx";
      
          const initialRouteValue = JSON.parse(document.getElementById('initial_route_context').textContent);
          const root = hydrateRoot(document.getElementById("root"), $jsx(SWRConfig, {
            value: { suspense: true },
            children: $jsx(RouterProvider, {
              value: initialRouteValue,
              children: $jsx(Page, {}, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this));
        `}}></script>
      </head>
      <body>
        <div id="root">
          <SWRConfig value={{ suspense: true }}>
            <RouterProvider value={initialRouteValue}>
              <Page />
            </RouterProvider>
          </SWRConfig>
        </div>
      </body>
    </html >
  );
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/html',
    },
    status: 200,
  });
}

const renderJs = async (url) => {
  const localFile = url.pathname.replace("/assets/js/", "").replace("src/", "");
  const src = await Bun.file(localFile).text();
  const result = await transpiler.transform(src);
  return new Response(result, {
    headers: {
      'Content-Type': 'application/javascript',
    },
    status: 200,
  });
}

const sendFile = async (url) => {
  const localFile = url.pathname.replace("/assets/js/", "").replace("src/", "");
  const result = await Bun.file(path.join(".cache", localFile)).text();
  let contentType = "application/javascript";
  if (url.pathname.endsWith(".css")) {
    contentType = 'text/css';
  }
  return new Response(result, {
    headers: {
      'Content-Type': contentType,
    },
    status: 200,
  });
}

export default {
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    console.log(req.method, url.pathname)
    if (url.pathname.includes("/components/") || url.pathname.includes("/containers/") || url.pathname.includes("/pages/")) {
      return sendFile(url);
    }
    if (url.pathname.includes("/assets/js")) {
      return renderJs(url);
    }
    if (url.pathname.includes("/api")) {
      return renderApi(url, req);
    }
    if (url.pathname.includes("/favicon")) {
      return new Response(`Not Found`, {
        headers: { 'Content-Type': 'text/html' },
        status: 404,
      });
    }
    return renderPage("./pages/index.jsx", url, {});
    // const route = router.match(url.pathname);
    // if (route) {
    //   return renderPage(route, url);
    // }
  },
};