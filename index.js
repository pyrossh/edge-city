import './astroPlugin.js';
import { renderToString, renderToReadableStream } from 'react-dom/server';
import { RouterProvider } from './router.js';

const router = new Bun.FileSystemRouter({
  style: "nextjs",
  dir: "./routes",
  origin: "https://mydomain.com",
  assetPrefix: "./public"
});

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
  const routeImport = await import(filePath);
  const Page = routeImport.default;
  const stream = await renderToReadableStream(
    <html lang="en">
      <head>
        {/* {routeImport.head()} */}
        <script id="initial_route_context" type='application/json' dangerouslySetInnerHTML={{
          __html: JSON.stringify(initialRouteValue)
        }} />
        <script type="importmap" dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            {
              "imports": {
                "react": "https://esm.sh/react@18.2.0?dev",
                "react-dom": "https://esm.sh/react-dom@18.2.0?dev",
                "react-dom/client": "https://esm.sh/react-dom@18.2.0/client?dev",
                "react/jsx-dev-runtime": "https://esm.sh/react@18.2.0/jsx-dev-runtime?dev",
                "@/utils": "/assets/js/src/utils.js",
              }
            }
          )
        }}>
        </script>
        {/* <script id="initial_swr_fallback" dangerouslySetInnerHTML={{ __html: JSON.stringify(value) }} /> */}
        <script type="module" src="/assets/js/routes/index.astro" defer></script>
      </head>
      <body>
        <div id="root">
          <RouterProvider value={initialRouteValue}>
            <Page />
          </RouterProvider>
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

export default {
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/dist/js")) {
      const src = await Bun.file("./dist/index.js").text();
      return new Response(src, {
        headers: {
          'Content-Type': 'application/javascript',
        },
        status: 200,
      });
    }
    if (url.pathname.startsWith("/assets/js")) {
      const lib = url.pathname.replace("/assets/js/", "");
      const localFile = lib.replace("src/", "");
      let result;
      if (localFile.includes("routes")) {
        result = await transpiler.transform(`
          import { hydrateRoot } from 'react-dom/client';
          import {RouterProvider} from "@/utils";
          import Page from "/dist/js/index.js";

          const initialRouteValue = JSON.parse(document.getElementById('initial_route_context').textContent);
          const root = hydrateRoot(document.getElementById('root'), (
            <RouterProvider value={initialRouteValue}>
              <Page />
            </RouterProvider>
          ));
        `);
      } else {
        const src = await Bun.file(localFile).text();
        result = await transpiler.transform(src);
      }
      return new Response(result, {
        headers: {
          'Content-Type': 'application/javascript',
        },
        status: 200,
      });
    }
    if (url.pathname.startsWith("/api")) {
      console.log('api', url.pathname);
      // return renderApi(route, req);
    }
    return renderPage("./routes/index.astro", url, {});
    // const route = router.match(url.pathname);
    // if (route) {
    //   return renderPage(route, url);
    // }
    return new Response(`Not Found`, {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  },
};