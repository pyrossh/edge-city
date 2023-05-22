# Edge City

edge-city is a next level meta-framework for react that runs only on edge runtimes.  
It uses esbuild as its bundler/transpiler.  
It uses file system routing (similar to next app router) with streaming SSR + CSR render pages.  
It is very opionated and has set of idiomatic ways of doing things.  
It has an inbuilt rpc mechanism to access server resources instead of a typical REST API.  
It aims to have almost the same router api as nextjs router for ease of use.  

During development each request for a page is executed in a separate edge-runtime (miniflare/vercel) vm.
During production each page is packaged to an esm function adapted to the platform of your choice.

## Why?
Because its really hard to have a streaming SSR + CSR setup in nextjs currently.  
The only other framework is rakkasjs but it doesn't maitaing as smooth transition from nextjs.  

### Supported platforms
1. [Cloudflare page functions](https://developers.cloudflare.com/pages/platform/functions/routing/)
2. [Vercel edge functions](https://vercel.com/docs/concepts/functions/edge-functions)
3. [Netlify edge functions](https://docs.netlify.com/edge-functions/overview/)
4. [Deno Deploy](https://deno.com/deploy)

### Todo
1. Hydrate rpc cache
2. Build a docs website
3. Fix 404/500 pages not routing
3. Add Env variables `PUBLIC_` for client
