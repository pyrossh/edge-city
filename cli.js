#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import esbuild from 'esbuild';
import resolve from 'esbuild-plugin-resolve';
import fs from "fs";
import fse from "fs-extra";
import path from 'path';
import walkdir from 'walkdir';
import postcss from "postcss"
import autoprefixer from "autoprefixer";
import postcssCustomMedia from "postcss-custom-media";
import postcssNesting from "postcss-nesting";
import bytes from 'bytes';
import pc from 'picocolors';
import ms from 'ms';
import watch from 'node-watch';
import dotenv from 'dotenv';

dotenv.config();

let isProd = false;
const srcDir = path.join(process.cwd(), "src");
const inputStaticDir = path.join(srcDir, "static");
const buildDir = path.join(process.cwd(), "build");
const staticDir = path.join(buildDir, "static");

const recordSize = (buildStart, dest) => {
  const outLength = fs.statSync(dest).size;
  const builtTime = ms(Date.now() - buildStart);
  console.log(
    `${pc.green("✓ Bundled")} ${dest.replace(process.cwd() + "/", "")} ${pc.cyan(`(${bytes(outLength)})`)} ${pc.gray(`[${builtTime}]`)}`
  );
}

let generatedCss = ``;
const cssCache = [];
const serverEnvs = Object.keys(process.env)
  .filter((k) => k.startsWith("EC_") || k === "NODE_ENV")
  .reduce((acc, k) => {
    acc[`process.env.${k}`] = JSON.stringify(process.env[k]);
    return acc
  }, {});
const clientEnvs = Object.keys(process.env)
  .filter((k) => k.startsWith("EC_PUBLIC") || k === "NODE_ENV")
  .reduce((acc, k) => {
    acc[`process.env.${k}`] = JSON.stringify(process.env[k]);
    return acc
  }, {});

const parseExports = (src) => {
  return src.split("\n").filter((l) => l.includes("export const") && l.includes("=>"))
    .map((l) => /export const (.*) = async/g.exec(l))
    .filter((n) => n && n[1])
    .map((n) => n[1]);
}

const bundleJs = async ({ entryPoints, isServer, outfile, ...options }, plg) => {
  const result = await esbuild.build({
    bundle: true,
    target: ['es2022'],
    entryPoints,
    outfile,
    format: 'esm',
    external: ["node:*"],
    color: true,
    keepNames: !isProd,
    minify: isProd,
    treeShaking: true,
    jsxDev: !isProd,
    jsx: 'automatic',
    ...options,
    define: isServer ? serverEnvs : clientEnvs,
    plugins: [
      resolve({
        "/routemap.json": `${staticDir}/routemap.json`,
      }),
      plg,
    ]
  });
  return result;
}

const buildRouteMap = (routes) => {
  const buildStart = new Date();
  const routemap = routes.reduce((acc, r) => {
    const key = r.out.replace("index", "").replace(".js", "");
    acc[key === "" ? "/" : key] = "/js" + r.out;
    return acc
  }, {});
  const outfile = path.join(staticDir, "routemap.json");
  fs.writeFileSync(outfile, JSON.stringify(routemap, null, 2));
  recordSize(buildStart, outfile);
}

const bundlePages = async () => {
  const routes = walkdir.sync(path.join(srcDir, "pages"))
    .filter((p) => p.includes("page.jsx"))
    .map((r) => ({
      in: r,
      out: (r.replace(srcDir, "").replace("/pages", "").replace("/page.jsx", "") || "/index") + ".js",
    }));
  buildRouteMap(routes);
  for (const r of routes) {
    const buildStart = Date.now();
    const outfile = `build/functions${r.out}`;
    await bundleJs({ isServer: true, entryPoints: [r.in], outfile }, {
      name: "page-plugin",
      setup(build) {
        build.onLoad({ filter: /\\*.page.jsx/, namespace: undefined }, (args) => {
          const data = fs.readFileSync(args.path);
          const newSrc = `
            import renderPage from "edge-city/renderPage";

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
  await bundleJs({
    isServer: false,
    entryPoints: routes.map((r) => ({
      in: r.in,
      out: "." + r.out.replace(".js", ""),
    })),
    outdir: "build/static/js",
    splitting: true,
    entryNames: '[dir]/[name]',
    chunkNames: 'chunks/[name]-[hash]'
  }, {
    name: "page-js-plugin",
    setup(build) {
      build.onLoad({ filter: /\\*.page.jsx/, namespace: undefined }, (args) => {
        const data = fs.readFileSync(args.path);
        const newSrc = `
            import { hydrateApp } from "edge-city";
            ${data.toString()}
  
            const searchParams = new URL(import.meta.url).searchParams;
            if (searchParams.get("hydrate") === "true") {
              hydrateApp()
            }
          `
        return {
          contents: newSrc,
          loader: "jsx",
        }
      });
      build.onLoad({ filter: /\\*.css/, namespace: undefined }, (args) => {
        return {
          contents: "",
          loader: "file",
        }
      });
      build.onLoad({ filter: /\\*.service.js/, namespace: undefined }, async (args) => {
        const src = fs.readFileSync(args.path, "utf8");
        const svcName = args.path.replace(srcDir, "").replace("/services/", "").replace(".service.js", "");
        const funcs = parseExports(src);
        const newSrc = `
          import { defineRpc } from "edge-city";
          ${funcs.map((f) => `export const ${f} = defineRpc("${svcName}/${f}")`).join("\n")}
        `
        return {
          contents: newSrc,
          loader: "js",
        };
      });
    }
  });
  for (const r of routes) {
    recordSize(Date.now(), `build/static/js${r.out}`);
  }
}

const bundleServices = async () => {
  const services = walkdir.sync(path.join(srcDir, "services"))
    .filter((s) => s.includes(".service.js"));
  for (const s of services) {
    const dest = s.replace(srcDir, "").replace("/services", "").replace(".service.js", "");
    const src = fs.readFileSync(s, 'utf8');
    const funcs = parseExports(src);
    for (const p of funcs) {
      const buildStart = Date.now();
      const result = await bundleJs({
        isServer: true,
        write: false,
        entryPoints: [s],
        // outfile: `build/functions/_rpc${dest}.js`,
      },
        {
          name: "service-plugin",
          setup(build) {
            build.onLoad({ filter: /\\*.service.js/, namespace: undefined }, async (args) => {
              const newSrc = `
            import renderApi from "edge-city/renderApi";
            ${src.toString()}

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
      fse.ensureDirSync(`build/functions/_rpc${dest}`)
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
  fse.ensureDirSync(`build/static/css`)
  fs.writeFileSync(`${process.cwd()}/build/static/css/app.css`, result.toString());
}

const build = async (platform, setProd) => {
  fse.removeSync(buildDir);
  fse.ensureDirSync(buildDir);
  fse.ensureDirSync(staticDir);
  fse.copySync(inputStaticDir, staticDir);
  if (setProd) {
    process.env.NODE_ENV = "production";
    isProd = true;
  }
  await bundlePages();
  await bundleServices();
  await bundleCss();
  if (!setProd) {
    // watch src files, imports and dotenv
    watch(srcDir, { recursive: true }, async (evt, name) => {
      await bundlePages();
      await bundleServices();
      await bundleCss();
    });
  }
  if (platform === "cloudflare") {
    // create _routes.json for cloudflare which only includes the pages and services
  }
}

yargs(hideBin(process.argv))
  .scriptName("edge-city")
  .usage('$0 <cmd> [args]')
  .command('build', 'build the project', (y) => {
    y.option('platform', {
      alias: 'p',
      description: 'The edge platform',
      choices: ['cloudflare', 'vercel'],
    })
      .demandOption("p")
  }, ({ platform }) => {
    build(platform, true);
  })
  .command('dev', 'run the dev server', (y) => {
    y.option('platform', {
      alias: 'p',
      type: 'string',
      description: 'cloudflare or vercel',
      choices: ['cloudflare', 'vercel']
    })
  }, ({ platform }) => {
    build(platform, false);
  })
  .demandCommand(1)
  .parse();