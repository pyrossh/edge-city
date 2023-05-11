# parotta

parotta is a next level meta-framework for react that runs only on edge runtimes. 
It uses bun as its bundler/transpiler and development mode as its quick and fast.
It uses File System routing with streaming SSR + CSR as the method to render pages. Basically a MPA + SPA Transitional App.
It is very opionated and has set of idiomatic ways of doing things.
It has inbuilt rpc mechanism to access server resources instead of a typical REST API.

### Todo
1. Add build step
2. Deploy to Node (using edge-runtime), Docker, Deno deploy, Vercel edge functions, Cloudflare workers, Bun edge (whenever it releases)
3. Hydrate rpc cache
4. Build a Website with Docs using parotta