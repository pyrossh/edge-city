#!/usr/bin/env bun
import meow from 'meow';
import React from "react";
import esbuild from 'esbuild';
import resolve from 'esbuild-plugin-resolve';
import { renderToReadableStream } from "react-dom/server";
import fs, { mkdir } from "fs";
import path from 'path';
import walkdir from 'walkdir';
import postcss from "postcss"
import autoprefixer from "autoprefixer";
import postcssCustomMedia from "postcss-custom-media";
import postcssNesting from "postcss-nesting";
import mimeTypes from "mime-types";
import bytes from 'bytes';
import pc from 'picocolors';
import ms from 'ms';
import pkg from "./package.json";

const cli = meow(`
parotta v${pkg.version}

Usage
  $ parotta build cloudflare
  $ parotta build vercel
`, {
  importMeta: import.meta,
  autoVersion: true,
});
if (cli.input.length != 2) {
  cli.showHelp();
  process.exit(0);
}



if (!globalThis.firstRun) {
  globalThis.firstRun = true
  const version = (await import(path.join(import.meta.dir, "package.json"))).default.version;
  console.log(`parotta v${version}`)
  console.log(`running with cwd=${path.basename(process.cwd())} node_env=${process.env.NODE_ENV}`);
} else {
  console.log(`server reloading`);
}
const isProd = process.env.NODE_ENV === "production";
const routes = walkdir.sync(path.join(process.cwd(), "pages"))
  .filter((p) => p.includes("page.jsx"));
const services = walkdir.sync(path.join(process.cwd(), "services"))
  .map((s) => s.replace(process.cwd(), ""))
  .filter((s) => s.includes(".service.js"))
  .forEach((s) => {
    const serviceName = s.replace(".service.js", "");
    routes[serviceName + "/*"] = { key: serviceName, service: s };
  });

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

const staticDir = path.join(process.cwd(), "build", "static");

const createDirs = () => {
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
  }
}

const buildImportMap = async () => {
  const packageJson = await import(path.join(process.cwd(), "package.json"));
  const config = packageJson.default.parotta || { hydrate: true };
  const devTag = !isProd ? "-dev-" : "";
  const devQueryParam = !isProd ? `?dev` : "";
  const nodeDeps = Object.keys(packageJson.default.dependencies).reduce((acc, dep) => {
    acc[dep] = `https://esm.sh/${dep}@${packageJson.default.dependencies[dep]}`;
    return acc;
  }, {})
  const components = mapDeps("components");
  const importmap = {
    "radix3": `https://esm.sh/radix3@1.0.1`,
    "history": "https://esm.sh/history@5.3.0",
    "react": `https://esm.sh/react@18.2.0${devQueryParam}`,
    [`react/jsx${devTag}runtime`]: `https://esm.sh/react@18.2.0${devQueryParam}/jsx${devTag}runtime`,
    "react-dom/client": `https://esm.sh/react-dom@18.2.0${devQueryParam}/client`,
    "nprogress": "https://esm.sh/nprogress@0.2.0",
    ...nodeDeps,
    ...components,
  }
  const outfile = path.join(staticDir, "importmap.json");
  fs.writeFileSync(outfile, JSON.stringify(importmap, null, 2));
}

const buildRouteMap = () => {
  const routemap = routes.reduce((acc, p) => {
    const r = p.replace(process.cwd(), "");
    const key = r.replace("/pages", "").replace("/page.jsx", "")
    acc[key === "" ? "/" : key] = r;
    return acc
  }, {});
  const outfile = path.join(staticDir, "routemap.json");
  fs.writeFileSync(outfile, JSON.stringify(routemap, null, 2));
}

const buildServer = async (r) => {
  const buildStart = Date.now();
  const shortName = r.replace(process.cwd(), "").replace("/pages", "");
  const outfile = `${process.cwd()}/build/functions${shortName.replace("page.jsx", "index.js")}`;
  const result = await esbuild.build({
    bundle: true,
    target: ['es2022'],
    entryPoints: [r],
    outfile: outfile,
    format: 'esm',
    keepNames: true,
    external: ["node:*"],
    color: true,
    treeShaking: true,
    // metafile: true,
    jsxDev: !isProd,
    jsx: 'automatic',
    define: {
      'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
    },
    plugins: [resolve({
      "/static/routemap.json": `${staticDir}/routemap.json`
    })]
  });
  // console.log(await analyzeMetafile(result.metafile))
  const outLength = fs.statSync(outfile).size;
  const builtTime = ms(Date.now() - buildStart);
  console.log(
    `${pc.green("✓ Bundled")} ${outfile.replace(process.cwd() + "/", "")} ${pc.cyan(`(${bytes(outLength)})`)} ${pc.gray(`[${builtTime}]`)}`
  );
}

const bundleBun = async (r) => {
  const buildStart = Date.now();
  const shortName = r.replace(process.cwd(), "").replace("/page.jsx", "");
  const result = await Bun.build({
    entrypoints: [r],
    outdir: `${process.cwd()}/bb/functions/${shortName}`,
  });
  if (!result.success) {
    console.error("Build failed");
    for (const message of result.logs) {
      // Bun will pretty print the message object
      console.error(message);
    }
  }
  for (const o of result.outputs) {
    const outLength = (await o.arrayBuffer()).byteLength;
    const builtTime = ms(Date.now() - buildStart);
    console.log(
      `✓ Bundled ${o.kind} ${o.path.replace(process.cwd() + "/bb", "")} ${pc.cyan(`(${bytes(outLength)})`)} ${pc.gray(`[${builtTime}]`)}`
    );
  }
}

const main = async () => {
  createDirs();
  buildImportMap();
  buildRouteMap();
  for (const r of routes) {
    buildServer(r);
  }
}

main();

// const createServerRouter = async () => {
//   const routes = {};
//   const dirs = walkdir.sync(path.join(process.cwd(), "pages"))
//     .map((s) => s.replace(process.cwd(), "")
//       .replace("/pages", "")
//       // .replaceAll("[", ":")
//       // .replaceAll("]", "")
//     )

//   dirs.filter((p) => p.includes('page.jsx'))
//     .map((s) => ({ path: s, route: s.replace("/page.jsx", "") }))
//     .forEach((page) => {
//       const key = page.route || "/";
//       routes[key] = { key: key, page: page.path };
//     });
//   walkdir.sync(path.join(process.cwd(), "static"))
//     .map((s) => s.replace(process.cwd(), "").replace("/static", ""))
//     .forEach((route) => {
//       routes[route] = { key: route, file: route }
//     });

//   return createRouter({
//     strictTrailingSlash: true,
//     routes: routes,
//   });
// }

// const createClientRouter = async () => {
//   const routes = await walkdir.sync(path.join(process.cwd(), "pages"))
//     .filter((p) => p.includes("page.jsx"))
//     .filter((p) => !p.includes("/_"))
// .map((s) => s.replace(process.cwd(), ""))
// .map((s) => s.replace("/pages", ""))
// .map((s) => s.replace("/page.jsx", ""))
//     .reduce(async (accp, r) => {
//       const acc = await accp;
//       const src = await import(`${process.cwd()}/pages${r}/page.jsx`);
//       if (!result.success) {
//         console.error("Build failed");
//         for (const message of result.logs) {
//           // Bun will pretty print the message object
//           console.error(message);
//         }
//       }
//       acc[r === "" ? "/" : r] = src.default;
//       return acc
//     }, Promise.resolve({}));
//   // console.log(clientRoutes);
// };


// const serverRouter = await createServerRouter();
// const clientRouter = await createClientRouter();
// const transpiler = new Bun.Transpiler({
//   loader: "jsx",
//   autoImportJSX: true,
//   jsxOptimizationInline: true,

//   // TODO
//   // autoImportJSX: false,
//   // jsxOptimizationInline: false,
// });

// const renderApi = async (key, filePath, req) => {
//   const url = new URL(req.url);
//   const params = req.method === "POST" ? await req.json() : Object.fromEntries(url.searchParams);
//   const funcName = url.pathname.replace(`${key}/`, "");
//   const js = await import(path.join(process.cwd(), filePath));
//   try {
//     const result = await js[funcName](params);
//     return new Response(JSON.stringify(result), {
//       headers: { 'Content-Type': 'application/json' },
//       status: 200,
//     });
//   } catch (err) {
//     const message = err.format ? err.format() : err;
//     return new Response(JSON.stringify(message), {
//       headers: { 'Content-Type': 'application/json' },
//       status: 400,
//     });
//   }

// }

// const renderCss = async (src) => {
//   try {
//     const cssText = await Bun.file(src).text();
//     const result = await postcss([
//       autoprefixer(),
//       postcssCustomMedia(),
//       // postcssNormalize({ browsers: 'last 2 versions' }),
//       postcssNesting,
//     ]).process(cssText, { from: src, to: src });
//     return new Response(result.css, {
//       headers: { 'Content-Type': 'text/css' },
//       status: 200,
//     });
//   } catch (err) {
//     return new Response(`Not Found`, {
//       headers: { 'Content-Type': 'text/html' },
//       status: 404,
//     });
//   }
// }

// const renderJs = async (srcFile) => {
//   try {
//     const jsText = await Bun.file(srcFile).text();
//     const result = await transpiler.transform(jsText);
//     // inject code which calls the api for that function
//     const lines = result.split("\n");
//     // lines.unshift(`import React from "react";`);

//     // replace all .service imports which rpc interface
//     let addRpcImport = false;
//     lines.forEach((ln) => {
//       if (ln.includes(".service")) {
//         addRpcImport = true;
//         const [importName, serviceName] = ln.match(/\@\/services\/(.*)\.service/);
//         const funcsText = ln.replace(`from "${importName}"`, "").replace("import", "").replace("{", "").replace("}", "").replace(";", "");
//         const funcsName = funcsText.split(",");
//         funcsName.forEach((fnName) => {
//           lines.push(`const ${fnName} = rpc("${serviceName}/${fnName.trim()}")`);
//         })
//       }
//     })
//     if (addRpcImport) {
//       lines.unshift(`import { rpc } from "parotta/runtime";`);
//     }
//     // remove .css and .service imports
//     const filteredJsx = lines.filter((ln) => !ln.includes(`.css"`) && !ln.includes(`.service"`)).join("\n");
//     //.replaceAll("$jsx", "React.createElement");
//     return new Response(filteredJsx, {
//       headers: {
//         'Content-Type': 'application/javascript',
//       },
//       status: 200,
//     });
//   } catch (err) {
//     return new Response(`Not Found`, {
//       headers: { 'Content-Type': 'text/html' },
//       status: 404,
//     });
//   }
// }

// const sendFile = async (src) => {
//   try {
//     const contentType = mimeTypes.lookup(src) || "application/octet-stream";
//     const stream = await Bun.file(src).stream();
//     return new Response(stream, {
//       headers: { 'Content-Type': contentType },
//       status: 200,
//     });
//   } catch (err) {
//     return new Response(`Not Found`, {
//       headers: { 'Content-Type': 'text/html' },
//       status: 404,
//     });
//   }
// }

// // const mf = new Miniflare({
// //   script: `
// //   addEventListener("fetch", (event) => {
// //     event.respondWith(new Response("Hello Miniflare!"));
// //   });
// //   `,
// // });
// // const res = await mf.dispatchFetch("http://localhost:3000/");
// // console.log(await res.text()); // Hello Miniflare!

// const server = async (req) => {
//   const url = new URL(req.url);
//   console.log(req.method, url.pathname);
//   // maybe this is needed
//   if (url.pathname.startsWith("/parotta/")) {
//     return renderJs(path.join(import.meta.dir, url.pathname.replace("/parotta/", "")));
//   }
//   if (url.pathname.endsWith(".css")) {
//     return renderCss(path.join(process.cwd(), url.pathname));
//   }
//   if (url.pathname.endsWith(".js") || url.pathname.endsWith(".jsx")) {
//     return renderJs(path.join(process.cwd(), url.pathname));
//   }
//   const match = serverRouter.lookup(url.pathname);
//   if (match && !match.key.includes("/_")) {
//     if (match.file) {
//       return sendFile(path.join(process.cwd(), `/static${match.file}`));
//     }
//     if (match.page && req.headers.get("Accept")?.includes('text/html')) {
//       return renderPage(url);
//     }
//     if (match.service) {
//       return renderApi(match.key, match.service, req);
//     }
//   }
//   if (req.headers.get("Accept")?.includes('text/html')) {
//     // not found html page
//     return renderPage(new URL(`${url.protocol}//${url.host}/_404`));
//   }
//   // not found generic page
//   return new Response(`{"message": "not found"}`, {
//     headers: { 'Content-Type': 'application/json' },
//     status: 404,
//   });
// }

// export default server;
