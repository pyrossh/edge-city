#!/usr/bin/env bun --hot

import React from 'react';
import path from 'path';
import walkdir from 'walkdir';
import postcss from "postcss"
import autoprefixer from "autoprefixer";
import postcssCustomMedia from "postcss-custom-media";
// import postcssNormalize from 'postcss-normalize';
import postcssNesting from "postcss-nesting";
import { createMemoryHistory } from "history";
import { createRouter } from 'radix3';
import mimeTypes from "mime-types";
import { Router } from "./router";
import { renderToReadableStream } from 'react-dom/server';
// import { renderToStream } from './render';

const version = (await import(path.join(import.meta.dir, "package.json"))).default.version;
console.log(`parotta v${version}`)
console.log(`running with cwd=${path.basename(process.cwd())} node_env=${process.env.NODE_ENV}`);
// console.log("deleting cache");
// rmSync(path.join(process.cwd(), ".cache"), { force: true, recursive: true })

const isProd = process.env.NODE_ENV === "production";

const mapFiles = () => {
  const routes = {};
  const dirs = walkdir.sync(path.join(process.cwd(), "routes"))
    .map((s) => s.replace(process.cwd(), "")
      .replace("/routes", "")
      // .replaceAll("[", ":")
      // .replaceAll("]", "")
    );
  dirs.filter((p) => p.includes('page.jsx'))
    .map((s) => ({ path: s, route: s.replace("/page.jsx", "") }))
    .forEach((page) => {
      const key = page.route || "/";
      routes[key] = { key: key, page: page.path };
    });
  dirs.filter((p) => p.includes('api.js'))
    .map((s) => s.replace(process.cwd(), ""))
    .map((s) => ({ path: s, route: s.replace("/api.js", "") }))
    .forEach((api) => {
      const key = api.route || "/";
      routes[key] = routes[key] || { key };
      routes[key].api = api.path;
    });
  walkdir.sync(path.join(process.cwd(), "static"))
    .map((s) => s.replace(process.cwd(), "").replace("/static", ""))
    .forEach((route) => {
      routes[route] = { key: route, file: route }
    });
  return routes;
}

const mapDeps = (dir) => {
  return walkdir.sync(path.join(process.cwd(), dir))
    .map((s) => s.replace(process.cwd(), ""))
    .filter((s) => s.includes(".jsx"))
    .reduce((acc, s) => {
      acc['@' + s.replace(".jsx", "")] = s
      return acc;
    }, {});
}

const mapPages = () => walkdir.sync(path.join(process.cwd(), "routes"))
  .filter((p) => p.includes('page.jsx'))
  .map((s) => s.replace(process.cwd(), ""))
  .map((s) => s.replace("/routes", ""))
  .map((s) => s.replace("/page.jsx", ""));

const serverSideRoutes = mapFiles();
const clientSideRoutes = mapPages();

const radixRouter = createRouter({
  strictTrailingSlash: true,
  routes: serverSideRoutes,
});

const renderApi = async (filePath, req) => {
  const routeImport = await import(path.join(process.cwd(), filePath));
  switch (req.method) {
    case "HEAD":
      return routeImport.onHead(req);
    case "OPTIONS":
      return routeImport.onOptions(req);
    case "GET":
      return routeImport.onGet(req);
    case "POST":
      return routeImport.onPost(req);
    case "PUT":
      return routeImport.onPut(req);
    case "PATCH":
      return routeImport.onPatch(req);
    case "DELETE":
      return routeImport.onDelete(req);
    default:
      return new Response(`{"message": "route not found"}`, {
        headers: { 'Content-Type': 'application/json' },
        status: 404,
      });
  }
}

const renderPage = async (filePath, url, params) => {
  const packageJson = await import(path.join(process.cwd(), "package.json"));
  const devTag = !isProd ? "?dev" : "";
  const nodeDeps = Object.keys(packageJson.default.dependencies).reduce((acc, dep) => {
    acc[dep] = `https://esm.sh/${dep}@${packageJson.default.dependencies[dep]}`;
    return acc;
  }, {})
  const components = mapDeps("components");
  const containers = mapDeps("containers");
  const cssFile = `${filePath.replace("jsx", "css")}`;
  const mainPage = await import(path.join(process.cwd(), filePath));
  const stream = await renderToReadableStream(
    <html lang="en">
      <head>
        <link rel="preload" href={cssFile} as="style" />
        <link rel="stylesheet" href={cssFile} />
        <script type="importmap" dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            {
              "imports": {
                "radix3": `https://esm.sh/radix3`,
                "history": "https://esm.sh/history@5.3.0",
                "react": `https://esm.sh/react@18.2.0${devTag}`,
                // TODO: need to remove this in prod
                "react/jsx-dev-runtime": `https://esm.sh/react@18.2.0${devTag}/jsx-dev-runtime`,
                "react-dom/client": `https://esm.sh/react-dom@18.2.0${devTag}/client`,
                // "parotta/router": `https://esm.sh/parotta@${version}/router.js`,
                // "parotta/error": `https://esm.sh/parotta@${version}/error.js`,
                "parotta/router": `/parotta/router.js`,
                "parotta/error": `/parotta/error.js`,
                ...nodeDeps,
                ...components,
                ...containers,
              }
            }
          )
        }}>
        </script>
        <mainPage.Head />
        <script type="module" defer={true} dangerouslySetInnerHTML={{
          __html: `
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { createBrowserHistory } from "history";
import { createRouter } from "radix3";
import { Router } from "parotta/router";

hydrateRoot(document.getElementById("root"), React.createElement(Router, {
  App: React.lazy(() => import("/routes/app.jsx")),
  history: createBrowserHistory(),
  radixRouter: createRouter({
    strictTrailingSlash: true,
    routes: {
      ${clientSideRoutes.map((r) => `"${r === "" ? "/" : r}": React.lazy(() => import("/routes${r === "" ? "" : r}/page.jsx"))`).join(',\n      ')}
    },
  }),
}));
        `
        }}></script>
      </head>
      <body>
        <div id="root">
          <Router
            App={React.lazy(() => import(`${process.cwd()}/routes/app.jsx`))}
            history={createMemoryHistory({
              initialEntries: [url.pathname + url.search],
            })}
            radixRouter={createRouter({
              strictTrailingSlash: true,
              routes: clientSideRoutes.reduce((acc, r) => {
                acc[r === "" ? "/" : r] = React.lazy(() => import(`${process.cwd()}/routes${r === "" ? "" : r}/page.jsx`));
                return acc
              }, {})
            })}
          />
        </div>
      </body>
    </html >
  );
  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' },
    status: 200,
  });
}

const renderCss = async (src) => {
  try {
    const cssText = await Bun.file(src).text();
    const result = await postcss([
      autoprefixer(),
      postcssCustomMedia(),
      // postcssNormalize({ browsers: 'last 2 versions' }),
      postcssNesting,
    ]).process(cssText, { from: src, to: src });
    return new Response(result.css, {
      headers: { 'Content-Type': 'text/css' },
      status: 200,
    });
  } catch (err) {
    return new Response(`Not Found`, {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  }
}

const transpiler = new Bun.Transpiler({
  loader: "jsx",
  autoImportJSX: true,
  jsxOptimizationInline: true,

  // TODO
  // autoImportJSX: false,
  // jsxOptimizationInline: false,
});

const renderJs = async (src) => {
  try {
    const jsText = await Bun.file(src).text();
    const result = await transpiler.transform(jsText);
    const js = result.replaceAll(`import"./page.css";`, "");
    // TODO
    //.replaceAll("$jsx", "React.createElement");
    return new Response(js, {
      headers: { 'Content-Type': 'application/javascript' },
      status: 200,
    });
  } catch (err) {
    return new Response(`Not Found`, {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  }
}

const sendFile = async (src) => {
  try {
    const contentType = mimeTypes.lookup(src) || "application/octet-stream";
    const stream = await Bun.file(src).stream();
    return new Response(stream, {
      headers: { 'Content-Type': contentType },
      status: 200,
    });
  } catch (err) {
    return new Response(`Not Found`, {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  }
}

export default {
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    console.log("GET", url.pathname);
    // maybe this is needed
    if (url.pathname.startsWith("/parotta/")) {
      return renderJs(path.join(import.meta.dir, url.pathname.replace("/parotta/", "")));
    }
    if (url.pathname.endsWith(".css")) {
      return renderCss(path.join(process.cwd(), url.pathname));
    }
    if (url.pathname.endsWith(".js") || url.pathname.endsWith(".jsx")) {
      return renderJs(path.join(process.cwd(), url.pathname));
    }
    const match = radixRouter.lookup(url.pathname);
    if (match) {
      if (match.file) {
        return sendFile(path.join(process.cwd(), `/static${match.file}`));
      }
      if (match.page && req.headers.get("Accept")?.includes('text/html')) {
        return renderPage(`/routes${match.page}`, url, match.params);
      }
      if (match.api) {
        return renderApi(`/routes${match.api}`, req);
      }
    }
    if (req.headers.get("Accept")?.includes('text/html')) {
      return renderPage(`/routes/404/page.jsx`, url, {});
    }
    return new Response(`{"message": "not found"}`, {
      headers: { 'Content-Type': 'application/json' },
      status: 404,
    });
  },
  error(error) {
    console.log("error", error);
    return new Response(`<pre>${error}\n${error.stack}</pre>`, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
}