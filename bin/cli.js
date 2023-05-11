#!/usr/bin/env bun --hot

import path from 'path';
import fs from 'fs';
import walkdir from 'walkdir';
import postcss from "postcss"
import autoprefixer from "autoprefixer";
import postcssCustomMedia from "postcss-custom-media";
import postcssNesting from "postcss-nesting";
import { createMemoryHistory } from "history";
import { createRouter } from 'radix3';
import mimeTypes from "mime-types";
import React from "react";
import { renderToReadableStream } from "react-dom/server";
import { HeadApp, BodyApp } from "../runtime";

const version = (await import(path.join(import.meta.dir, "../package.json"))).default.version;
console.log(`parotta v${version}`)
console.log(`running with cwd=${path.basename(process.cwd())} node_env=${process.env.NODE_ENV}`);

const isProd = process.env.NODE_ENV === "production";

const createServerRouter = async () => {
  const routes = {};
  const dirs = walkdir.sync(path.join(process.cwd(), "pages"))
    .map((s) => s.replace(process.cwd(), "")
      .replace("/pages", "")
      // .replaceAll("[", ":")
      // .replaceAll("]", "")
    );
  walkdir.sync(path.join(process.cwd(), "services"))
    .map((s) => s.replace(process.cwd(), ""))
    .filter((s) => s.includes(".service.js"))
    .forEach((s) => {
      const serviceName = s.replace(".service.js", "");
      routes[serviceName + "/*"] = { key: serviceName, service: s };
    });
  dirs.filter((p) => p.includes('page.jsx'))
    .map((s) => ({ path: s, route: s.replace("/page.jsx", "") }))
    .forEach((page) => {
      const key = page.route || "/";
      routes[key] = { key: key, page: page.path };
    });
  dirs.filter((p) => p.includes('layout.jsx'))
    .map((s) => ({ path: s, route: s.replace("/layout.jsx", "") }))
    .forEach((item) => {
      const key = item.route || "/";
      routes[key].layout = item.path;
    });
  walkdir.sync(path.join(process.cwd(), "static"))
    .map((s) => s.replace(process.cwd(), "").replace("/static", ""))
    .forEach((route) => {
      routes[route] = { key: route, file: route }
    });

  return createRouter({
    strictTrailingSlash: true,
    routes: routes,
  });
}

const createClientRouter = async () => {
  const routes = await walkdir.sync(path.join(process.cwd(), "pages"))
    .filter((p) => p.includes('page.jsx'))
    .map((s) => s.replace(process.cwd(), ""))
    .map((s) => s.replace("/pages", ""))
    .map((s) => s.replace("/page.jsx", ""))
    .reduce(async (accp, r) => {
      const acc = await accp;
      const src = await import(`${process.cwd()}/pages${r}/page.jsx`);
      const exists = fs.existsSync(`${process.cwd()}/pages${r}/layout.jsx`);
      const lpath = exists ? `/pages${r}/layout.jsx` : `/pages/layout.jsx`;
      const lsrc = await import(`${process.cwd()}${lpath}`);
      acc[r === "" ? "/" : r] = {
        Head: src.Head,
        Body: src.Body,
        Layout: lsrc.default,
        LayoutPath: lpath,
      }
      return acc
    }, Promise.resolve({}));
  // console.log(clientRoutes);
  const hydrationScript = `
    import React from "react";
    import { hydrateRoot } from "react-dom/client";
    import { createBrowserHistory } from "history";
    import nProgress from "nprogress";
    import { createRouter } from "radix3";
    import { HeadApp, BodyApp } from "parotta/runtime";


    const history = createBrowserHistory();
    const radixRouter = createRouter({
      strictTrailingSlash: true,
      routes: {
        ${Object.keys(routes).map((r) => `"${r}": {
          Head: React.lazy(() => import("/pages${r}/page.jsx").then((js) => ({ default: js.Head }))),
          Body: React.lazy(() => import("/pages${r}/page.jsx").then((js) => ({ default: js.Body }))),
          Layout: React.lazy(() => import("${routes[r].LayoutPath}")),
          LayoutPath: "${routes[r].LayoutPath}",
        }`).join(',\n      ')}
      },
    });

    hydrateRoot(document.head, React.createElement(HeadApp, {
      history,
      radixRouter,
    }))

    hydrateRoot(document.body, React.createElement(BodyApp, {
      nProgress,
      history,
      radixRouter,
    }));`
  const router = createRouter({
    strictTrailingSlash: true,
    routes: routes,
  });
  router.hydrationScript = hydrationScript;
  return router;
};

const mapDeps = (dir) => {
  return walkdir.sync(path.join(process.cwd(), dir))
    .map((s) => s.replace(process.cwd(), ""))
    .filter((s) => s.includes(".jsx") || s.includes(".js"))
    .reduce((acc, s) => {
      if (s.includes(".jsx")) {
        acc['@' + s.replace(".jsx", "")] = s
      }
      if (s.includes(".js")) {
        acc['@' + s.replace(".js", "")] = s
      }
      return acc;
    }, {});
}

const serverRouter = await createServerRouter();
const clientRouter = await createClientRouter();
const transpiler = new Bun.Transpiler({
  loader: "jsx",
  autoImportJSX: true,
  jsxOptimizationInline: true,

  // TODO
  // autoImportJSX: false,
  // jsxOptimizationInline: false,
});

const renderApi = async (key, filePath, req) => {
  const url = new URL(req.url);
  const params = req.method === "POST" ? await req.json() : Object.fromEntries(url.searchParams);
  const funcName = url.pathname.replace(`${key}/`, "");
  const js = await import(path.join(process.cwd(), filePath));
  const result = await js[funcName](params);
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

const renderPage = async (url) => {
  const packageJson = await import(path.join(process.cwd(), "package.json"));
  const config = packageJson.default.parotta || { hydrate: true };
  const devTag = !isProd ? "?dev" : "";
  const nodeDeps = Object.keys(packageJson.default.dependencies).reduce((acc, dep) => {
    acc[dep] = `https://esm.sh/${dep}@${packageJson.default.dependencies[dep]}`;
    return acc;
  }, {})
  const components = mapDeps("components");
  const containers = mapDeps("containers");
  const importMap = {
    "radix3": `https://esm.sh/radix3`,
    "history": "https://esm.sh/history@5.3.0",
    "react": `https://esm.sh/react@18.2.0${devTag}`,
    // TODO: need to remove this in prod
    "react/jsx-dev-runtime": `https://esm.sh/react@18.2.0${devTag}/jsx-dev-runtime`,
    "react-dom/client": `https://esm.sh/react-dom@18.2.0${devTag}/client`,
    "nprogress": "https://esm.sh/nprogress@0.2.0",
    // "parotta/runtime": `https://esm.sh/parotta@${version}/runtime.js`,
    "parotta/runtime": `../parotta/runtime.js`,
    ...nodeDeps,
    ...components,
    ...containers,
  };
  const history = createMemoryHistory({
    initialEntries: [url.pathname + url.search],
  });
  const stream = await renderToReadableStream(
    <html lang="en">
      <head>
        <HeadApp
          history={history}
          radixRouter={clientRouter}
          importMap={importMap}
        />
      </head>
      <body>
        <BodyApp nProgress={{ start: () => { }, done: () => { } }} history={history} radixRouter={clientRouter} />
        {config.hydrate &&
          <>
            <script type="module" defer={true} dangerouslySetInnerHTML={{
              __html: clientRouter.hydrationScript
            }}>
            </script>
          </>
        }
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

const renderJs = async (srcFile) => {
  try {
    const jsText = await Bun.file(srcFile).text();
    const result = await transpiler.transform(jsText);
    // inject code which calls the api for that function
    const lines = result.split("\n");

    // replace all .service imports which rpc interface
    let addRpcImport = false;
    lines.forEach((ln) => {
      if (ln.includes(".service")) {
        addRpcImport = true;
        const [importName, serviceName] = ln.match(/\@\/services\/(.*)\.service/);
        const funcsText = ln.replace(`from "${importName}"`, "").replace("import", "").replace("{", "").replace("}", "").replace(";", "");
        const funcsName = funcsText.trim().split(",");
        funcsName.forEach((fnName) => {
          lines.push(`const ${fnName} = rpc("${serviceName}/${fnName}")`);
        })
      }
    })
    if (addRpcImport) {
      lines.unshift(`import { rpc } from "parotta/runtime"`);
    }
    // remove .css and .service imports
    const filteredJsx = lines.filter((ln) => !ln.includes(".css") && !ln.includes(".service")).join("\n");
    //.replaceAll("$jsx", "React.createElement");
    return new Response(filteredJsx, {
      headers: {
        'Content-Type': 'application/javascript',
      },
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
    console.log(req.method, url.pathname);
    // maybe this is needed
    if (url.pathname.startsWith("/parotta/")) {
      return renderJs(path.join(import.meta.dir, url.pathname.replace("/parotta/", "../")));
    }
    if (url.pathname.endsWith(".css")) {
      return renderCss(path.join(process.cwd(), url.pathname));
    }
    if (url.pathname.endsWith(".js") || url.pathname.endsWith(".jsx")) {
      return renderJs(path.join(process.cwd(), url.pathname));
    }
    const match = serverRouter.lookup(url.pathname);
    if (match) {
      if (match.file) {
        return sendFile(path.join(process.cwd(), `/static${match.file}`));
      }
      if (match.page && req.headers.get("Accept")?.includes('text/html')) {
        return renderPage(url);
      }
      if (match.service) {
        return renderApi(match.key, match.service, req);
      }
    }
    if (req.headers.get("Accept")?.includes('text/html')) {
      return renderPage(url);
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