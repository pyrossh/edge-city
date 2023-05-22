# Edge City

edge-city is a next level meta-framework for react that runs only on edge runtimes.  
It uses esbuild as its bundler/transpiler.  
It uses file system routing (similar to nextjs app router) with streaming SSR + CSR to render pages.  
It is very opionated and has set of idiomatic ways of doing things.  
It has an inbuilt rpc mechanism to access server resources instead of a typical REST API.  
It aims to have almost the same router api as nextjs router for ease of use.  

During development each request for a page is executed in a separate edge-runtime (miniflare/vercel) vm.  
During production each page is packaged to an esm function adapted to the platform of your choice.

## Why?
Beacause,
* Its really hard to have a streaming SSR + CSR setup in nextjs currently.  
* There is no framework which runs your code in an edge simulated environment during development and targets only edge for production.  

## Requirements
1. `node >= v20`
2. `wrangler` for deploying to cloudflare page functions
3. `vercel` for deploying to vercel edge runtime

### Supported platforms
1. [Cloudflare page functions](https://developers.cloudflare.com/pages/platform/functions/routing/)
2. [Vercel edge functions](https://vercel.com/docs/concepts/functions/edge-functions)
3. [Netlify edge functions](https://docs.netlify.com/edge-functions/overview/)
4. [Deno Deploy](https://deno.com/deploy)

## Developing

1. `node >= v20.2.0`
2. `pnpm >= v8.5.1`

### Todo
1. Hydrate rpc cache
2. Build a docs website
3. Fix 404/500 pages not routing
4. Add Env variables `PUBLIC_` for client
5. Add tests for bot
6. Add tests for runtime
7. Maybe move to vite for HMR goodness
