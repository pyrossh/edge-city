# parotta

parotta is a next level meta-framework for react that runs only on edge runtimes.  
It uses bun as its bundler/transpiler and development mode as its quick and fast.  
It uses File System routing with streaming SSR + CSR as the method to render pages.  
It is very opionated and has set of idiomatic ways of doing things.  
It has an inbuilt rpc mechanism to access server resources instead of a typical REST API.  

During development each request for a page is executed in a separate vercel edge-runtime vm.
During production each page is packaged to an esm function adapted to the platform of your choice.

### Todo
1. Hydrate rpc cache
2. Build a docs website using parotta

### Supported platforms
1. [Cloudflare page functions](https://developers.cloudflare.com/pages/platform/functions/routing/)
2. [Vercel edge functions](https://vercel.com/docs/concepts/functions/edge-functions)
3. [Netlify edge functions](https://docs.netlify.com/edge-functions/overview/)
4. [Deno Deploy](https://deno.com/deploy)