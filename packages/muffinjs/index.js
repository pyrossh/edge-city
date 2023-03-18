// import './jsxPlugin.js';
import React from 'react';
import path from 'path';
import { rmSync, readFileSync } from "fs";
import postcss from "postcss"
import autoprefixer from "autoprefixer";
import postcssCustomMedia from "postcss-custom-media";
// import postcssNormalize from 'postcss-normalize';
import postcssNesting from "postcss-nesting";
import { renderToReadableStream } from 'react-dom/server';
import { routerAtom } from './router.js';

console.log("running in folder:", path.basename(process.cwd()), "env:", process.env.NODE_ENV);
console.log("deleting cache");
rmSync(path.join(process.cwd(), ".cache"), { force: true, recursive: true })

const isProd = process.env.NODE_ENV === "production";

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
  const routeImport = await import(path.join(process.cwd(), filePath));
  const packageJson = await import(path.join(process.cwd(), "package.json"));
  const dependencies = packageJson.default.dependencies;
  const devTag = !isProd ? "?dev" : "";
  const imports = Object.keys(dependencies).reduce((acc, dep) => {
    acc[dep] = `https://esm.sh/${dep}@${dependencies[dep]}${devTag}`;
    return acc;
  }, {})
  const Page = routeImport.default;
  console.log(filePath)
  const stream = await renderToReadableStream(
    <html lang="en">
      <head>
        <link rel="stylesheet" href={`${filePath.replace("jsx", "css")}`} />
        <script type="importmap" dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            {
              "imports": {
                ...imports,
                "react-dom/client": `https://esm.sh/react-dom@18.2.0/client${devTag}`,
                "react/jsx-dev-runtime": `https://esm.sh/react@18.2.0/jsx-dev-runtime${devTag}`,
                "muffinjs": "https://esm.sh/muffinjs",
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
          // import { routerAtom } from "muffinjs/router.js";
          import Page from "${filePath}";

          // routerAtom.update(() => (${JSON.stringify(initialRouteValue)}));

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
    headers: { 'Content-Type': 'text/html' },
    status: 200,
  });
}

const renderCss = async (url) => {
  const cssText = readFileSync(path.join(process.cwd(), url.pathname), "utf-8");
  const result = await postcss([
    autoprefixer(),
    postcssCustomMedia(),
    // postcssNormalize({ browsers: 'last 2 versions' }),
    postcssNesting,
  ]).process(cssText);
  return new Response(result.css, {
    headers: { 'Content-Type': 'text/css' },
    status: 200,
  });
}

const renderJs = async (url) => {
  const jsText = readFileSync(path.join(process.cwd(), url.pathname), "utf-8");
  const result = await transpiler.transform(jsText);
  const js = result.replaceAll(`import"./page.css";`, "");
  return new Response(js, {
    headers: { 'Content-Type': 'application/javascript' },
    status: 200,
  });
}

export default {
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.endsWith(".css")) {
      return renderCss(url);
    }
    if (url.pathname.endsWith(".js") || url.pathname.endsWith(".jsx")) {
      return renderJs(url);
    }
    if (url.pathname.includes("/favicon")) {
      return new Response(`Not Found`, {
        headers: { 'Content-Type': 'text/html' },
        status: 404,
      });
    }
    if (url.pathname.includes("/")) {
      return renderPage("/routes/index/page.jsx", url, {});
    }
    return new Response(`Not Found`, {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  },
};