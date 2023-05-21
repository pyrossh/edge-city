#!/usr/bin/env bun
import meow from 'meow';
import esbuild from 'esbuild';
import resolve from 'esbuild-plugin-resolve';
import fs from "fs";
import path from 'path';
import walkdir from 'walkdir';
import postcss from "postcss"
import autoprefixer from "autoprefixer";
import postcssCustomMedia from "postcss-custom-media";
import postcssNesting from "postcss-nesting";
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

const ensureDir = (d) => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
}

const createDirs = () => {
  const buildDir = path.join(process.cwd(), "build");
  ensureDir(buildDir);
  ensureDir(staticDir);
}

const recordSize = (buildStart, dest) => {
  const outLength = fs.statSync(dest).size;
  const builtTime = ms(Date.now() - buildStart);
  console.log(
    `${pc.green("✓ Bundled")} ${dest.replace(process.cwd() + "/", "")} ${pc.cyan(`(${bytes(outLength)})`)} ${pc.gray(`[${builtTime}]`)}`
  );
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
    "imports": {
      "radix3": `https://esm.sh/radix3@1.0.1`,
      "history": "https://esm.sh/history@5.3.0",
      "react": `https://esm.sh/react@18.2.0${devQueryParam}`,
      [`react/jsx${devTag}runtime`]: `https://esm.sh/react@18.2.0${devQueryParam}/jsx${devTag}runtime`,
      "react-dom/client": `https://esm.sh/react-dom@18.2.0${devQueryParam}/client`,
      "nprogress": "https://esm.sh/nprogress@0.2.0",
      ...nodeDeps,
      ...components,
    }
  }
  const outfile = path.join(staticDir, "importmap.json");
  fs.writeFileSync(outfile, JSON.stringify(importmap, null, 2));
}

const buildRouteMap = (routes) => {
  const routemap = routes.reduce((acc, p) => {
    const r = p.replace(process.cwd(), "");
    const key = r.replace("/pages", "").replace("/page.jsx", "")
    acc[key === "" ? "/" : key] = "/js" + (r.replace("/pages", "").replace("/page.jsx", "") || "/index") + ".js";
    return acc
  }, {});
  const outfile = path.join(staticDir, "routemap.json");
  fs.writeFileSync(outfile, JSON.stringify(routemap, null, 2));
}

let generatedCss = ``;
const cssCache = [];
const bundleJs = async (options, src, dest, plg) => {
  const result = await esbuild.build({
    bundle: true,
    target: ['es2022'],
    entryPoints: [src],
    outfile: dest,
    format: 'esm',
    keepNames: true,
    external: ["node:*"],
    color: true,
    treeShaking: true,
    // loader: { '.json': 'copy' },
    // metafile: true,
    jsxDev: !isProd,
    jsx: 'automatic',
    ...options,
    define: {
      'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
      'process.env.PG_CONN_URL': "123",
    },
    plugins: [
      resolve({
        "/routemap.json": `${staticDir}/routemap.json`,
        "/importmap.json": `${staticDir}/importmap.json`
      }),
      plg,
    ]
  });
  return result;
}

// const bundleBun = async (r, type) => {
//   const buildStart = Date.now();
//   const shortName =  r.replace(process.cwd(), "").replace("/page.jsx", "");
//   const result = await Bun.build({
//     entrypoints: [r],
//     outdir: `${process.cwd()}/bb/functions/${shortName}`,
//   });
//   if (!result.success) {
//     console.error("Build failed");
//     for (const message of result.logs) {
//       // Bun will pretty print the message object
//       console.error(message);
//     }
//   }
//   for (const o of result.outputs) {
//     const outLength = (await o.arrayBuffer()).byteLength;
//     const builtTime = ms(Date.now() - buildStart);
//     console.log(
//       `✓ Bundled ${o.kind} ${o.path.replace(process.cwd() + "/bb", "")} ${pc.cyan(`(${bytes(outLength)})`)} ${pc.gray(`[${builtTime}]`)}`
//     );
//   }
// }

const bundlePages = async () => {
  const routes = walkdir.sync(path.join(process.cwd(), "pages"))
    .filter((p) => p.includes("page.jsx"));
  buildRouteMap(routes);
  for (const r of routes) {
    const buildStart = Date.now();
    const dest = r.replace(process.cwd(), "").replace("/pages", "").replace("/page.jsx", "") || "/index";
    const outfile = `build/functions${dest}.js`;
    await bundleJs({}, r, outfile, {
      name: "parotta-page-plugin",
      setup(build) {
        build.onLoad({ filter: /\\*.page.jsx/, namespace: undefined }, (args) => {
          const data = fs.readFileSync(args.path);
          const newSrc = `
            import { renderPage } from "parotta-runtime";
            ${data.toString()}

            export function onRequest(context) {
              return renderPage(Page, context.request);
            }
          `
          return {
            contents: newSrc,
            loader: "jsx",
          }
        });
        build.onLoad({ filter: /\\*.css/, namespace: undefined }, (args) => {
          if (!cssCache[args.path]) {
            const css = fs.readFileSync(args.path);
            generatedCss += css + "\n\n";
            cssCache[args.path] = true;
          }
          return {
            contents: "",
            loader: "file",
          }
        });
      }
    });
    recordSize(buildStart, outfile);
  }
  for (const r of routes) {
    const buildStart = Date.now();
    const dest = r.replace(process.cwd(), "").replace("/pages", "").replace("/page.jsx", "") || "/index";
    const outfile = `build/static/js${dest}.js`;
    await bundleJs({}, r, outfile, {
      name: "parotta-page-js-plugin",
      setup(build) {
        build.onLoad({ filter: /\\*.page.jsx/, namespace: undefined }, (args) => {
          const data = fs.readFileSync(args.path);
          const newSrc = `
            import { hydrateApp } from "parotta-runtime";
            ${data.toString()}

            const searchParams = new URL(import.meta.url).searchParams;
            if (searchParams.get("hydrate") === "true") {
              hydrateApp(Page)
            }
          `
          return {
            contents: newSrc,
            loader: "jsx",
          }
        });
      }
    });
    recordSize(buildStart, outfile);
  }
}

const bundleServices = async () => {
  const services = walkdir.sync(path.join(process.cwd(), "services"))
    .filter((s) => s.includes(".service.js"));
  for (const s of services) {
    const dest = s.replace(process.cwd(), "").replace("/services", "").replace(".service.js", "")
    const pkg = await import(s);
    for (const p of Object.keys(pkg)) {
      const buildStart = Date.now();
      const result = await bundleJs({ write: false }, s, `build/functions/_rpc${dest}.js`, {
        name: "parotta-service-plugin",
        setup(build) {
          build.onLoad({ filter: /\\*.service.js/, namespace: undefined }, async (args) => {
            const src = fs.readFileSync(args.path);
            const newSrc = `
              ${src.toString()}

              export const renderApi = async (fn, req) => {
                const url = new URL(req.url);
                const params = req.method === "POST" ? await req.json() : Object.fromEntries(url.searchParams);
                try {
                  const result = await fn(params);
                  return new Response(JSON.stringify(result), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 200,
                  });
                } catch (err) {
                  const message = err.format ? err.format() : err;
                  return new Response(JSON.stringify(message), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 400,
                  });
                }
              }

              export function onRequest(context) {
                return renderApi(${p}, context.request);
              }
            `
            return {
              contents: newSrc,
              loader: "js",
            };
          });
        }
      })
      ensureDir(`build/functions/_rpc${dest}`)
      const outfile = `build/functions/_rpc${dest}/${p}.js`;
      fs.writeFileSync(outfile, result.outputFiles[0].contents);
      recordSize(buildStart, outfile);
    }
  }
}

const bundleCss = async () => {
  const result = await postcss([
    autoprefixer(),
    postcssCustomMedia(),
    postcssNesting,
  ]).process(generatedCss, { from: "app.css", to: "app.css" });
  ensureDir(`build/static/css`)
  fs.writeFileSync(`${process.cwd()}/build/static/css/app.css`, result.toString());
}

const main = async () => {
  createDirs();
  buildImportMap();
  await bundlePages();
  // await bundleServices();
  await bundleCss();
}

main();

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