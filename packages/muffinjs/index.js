import './jsxPlugin.js';
import React from 'react';
import path from 'path';
import { renderToReadableStream } from 'react-dom/server';
import { routerAtom } from './router.js';

console.log("running in", process.cwd());

const transpiler = new Bun.Transpiler({
  loader: "jsx",
  autoImportJSX: true,
  jsxOptimizationInline: true,
});

const renderApi = async (route, req) => {
  const routeImport = await import(route.filePath);
  console.log('routeImport', routeImport);
}

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
  routerAtom.update(() => initialRouteValue);
  const routeImport = await import(filePath);
  const packageJson = await import(path.join(process.cwd(), "package.json"));
  const dependencies = packageJson.default.dependencies;
  const imports = Object.keys(dependencies).reduce((acc, dep) => {
    acc[dep] = `https://esm.sh/${dep}@${dependencies[dep]}?dev`;
    return acc;
  }, {})
  const Page = routeImport.default;
  const stream = await renderToReadableStream(
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/routes/index/page.css" />
        <script type="importmap" dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            {
              "imports": {
                ...imports,
                "react-dom/client": "https://esm.sh/react-dom@18.2.0/client?dev",
                "react/jsx-dev-runtime": "https://esm.sh/react@18.2.0/jsx-dev-runtime?dev",
                "@/atom.js": "/assets/js/src/atom.js",
                "@/router.js": "/assets/js/src/router.js",
                "@/routes/index/page.jsx": "/routes/index/page.js",
                "@/components/Todo.jsx": "/components/Todo.js",
                "@/containers/TodoList.jsx": "/containers/TodoList.js"
              }
            }
          )
        }}>
        </script>
        <script type="module" defer dangerouslySetInnerHTML={{
          __html: `
          import React from 'react';
          import { hydrateRoot } from 'react-dom/client';
          import { routerAtom } from "@/router.js";
          import Page from "@/routes/index/page.jsx";

          routerAtom.update(() => (${JSON.stringify(initialRouteValue)}));

          hydrateRoot(document.getElementById("root"), React.createElement(Page, {}, undefined, false, undefined, this));
        `}}></script>
      </head>
      <body>
        <div id="root">
          <Page />
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
    if (url.pathname.includes("/components/") || url.pathname.includes("/containers/") || url.pathname.includes("/routes/")) {
      return sendFile(url);
    }
    if (url.pathname.includes("/assets/js")) {
      return renderJs(url);
    }
    if (url.pathname.includes("/favicon")) {
      return new Response(`Not Found`, {
        headers: { 'Content-Type': 'text/html' },
        status: 404,
      });
    }
    if (url.pathname.includes("/")) {
      return renderPage(process.cwd() + "/routes/index/page.jsx", url, {});
    }
    return new Response(`Not Found`, {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  },
};