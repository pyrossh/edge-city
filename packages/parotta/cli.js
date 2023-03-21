#!/usr/bin/env bun --hot

import path from 'path';
import walkdir from 'walkdir';
import postcss from "postcss"
import autoprefixer from "autoprefixer";
import postcssCustomMedia from "postcss-custom-media";
// import postcssNormalize from 'postcss-normalize';
import postcssNesting from "postcss-nesting";
import { createRouter } from 'radix3';
import mimeTypes from "mime-types";
import { renderToReadableStream } from 'react-dom/server';
// import { renderToStream } from './render';

const version = (await import(path.join(import.meta.dir, "package.json"))).default.version;
console.log(`parotta v${version}`)
console.log("running in folder:", path.basename(process.cwd()), "env:", process.env.NODE_ENV);
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

const removeCwd = (s) => s.replace(process.cwd(), "")

const hydrateScript = (appPath, pagePath, routerProps) => {
  return `
import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "${removeCwd(appPath)}";
import Page from "${removeCwd(pagePath)}";

const routerProps = ${JSON.stringify(routerProps)};

hydrateRoot(document.getElementById("root"), React.createElement(App, {
  routerProps: routerProps,
  children: React.createElement(Page, {}),
}));
  `;
}

const radixRouter = createRouter({
  strictTrailingSlash: true,
  routes: mapFiles(),
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
  const query = {};
  for (const key of url.searchParams.keys()) {
    query[key] = url.searchParams.get(key);
  }
  const routerProps = {
    query: query,
    params: params,
    pathname: url.pathname,
  }
  const appPath = path.join(process.cwd(), "routes", "app.jsx");
  const pagePath = path.join(process.cwd(), filePath);
  const packageJson = await import(path.join(process.cwd(), "package.json"));
  const devTag = !isProd ? "?dev" : "";
  const nodeDeps = Object.keys(packageJson.default.dependencies).reduce((acc, dep) => {
    acc[dep] = `https://esm.sh/${dep}@${packageJson.default.dependencies[dep]}`;
    return acc;
  }, {})
  const App = (await import(appPath)).default;
  const Page = (await import(pagePath)).default;
  const components = mapDeps("components");
  const containers = mapDeps("containers");
  const cssFile = `${filePath.replace("jsx", "css")}`;
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
                "react": `https://esm.sh/react@18.2.0`,
                "react/jsx-dev-runtime": `https://esm.sh/react@18.2.0/jsx-dev-runtime`,
                "react-dom/client": `https://esm.sh/react-dom@18.2.0/client`,
                "react-streaming": "https://esm.sh/react-streaming",
                "parotta/router": `https://esm.sh/parotta@${version}/router.js`,
                "parotta/error": `https://esm.sh/parotta@${version}/error.js`,
                ...nodeDeps,
                ...components,
                ...containers,
              }
            }
          )
        }}>
        </script>
        <script type="module" defer={true} dangerouslySetInnerHTML={{
          __html: hydrateScript(appPath, pagePath, routerProps)
        }}></script>
        <title>
          Parotta
        </title>
      </head>
      <body>
        <div id="root">
          <App routerProps={routerProps}>
            <Page />
          </App>
        </div>
      </body>
    </html >
  );
  // injectToStream('<script type="module" src="/main.js"></script>', { flush: true });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' },
    status: 200,
  });
}

const renderCss = async (url) => {
  try {
    const cssText = await Bun.file(path.join(process.cwd(), url.pathname)).text();
    const result = await postcss([
      autoprefixer(),
      postcssCustomMedia(),
      // postcssNormalize({ browsers: 'last 2 versions' }),
      postcssNesting,
    ]).process(cssText, { from: url.pathname, to: url.pathname });
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

const sendFile = async (file) => {
  try {
    const contentType = mimeTypes.lookup(file) || "application/octet-stream";
    const stream = await Bun.file(path.join(process.cwd(), file)).stream();
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
    if (url.pathname.endsWith(".css")) {
      return renderCss(url);
    }
    if (url.pathname.endsWith(".js") || url.pathname.endsWith(".jsx")) {
      return renderJs(path.join(process.cwd(), url.pathname));
    }
    // maybe this is needed
    // if (url.pathname.startsWith("/parotta/")) {
    //   return renderJs(path.join(import.meta.dir, url.pathname.replace("/parotta/", "")) + ".js");
    // }
    const match = radixRouter.lookup(url.pathname);
    if (match) {
      if (match.file) {
        return sendFile(`/static${match.file}`);
      }
      if (match.page && req.headers.get("Accept")?.includes('text/html')) {
        return renderPage(`/routes${match.page}`, url, match.params);
      }
      if (match.api) {
        return renderApi(`/routes${match.api}`, req);
      }
    }
    return new Response(`Not Found`, {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  },
  // error(error) {
  //   return new Response(`<pre>${error}\n${error.stack}</pre>`, {
  //     headers: {
  //       "Content-Type": "text/html",
  //     },
  //   });
  // },
}