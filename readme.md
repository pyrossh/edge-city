<img src="https://github.com/pyrossh/edge-city/assets/1687946/29f61137-d467-4730-9368-29ffb259c192" width="200px">

# edge-city

edge-city is a next level meta-framework for react that runs only on edge runtimes.  
It uses file system routing with streaming SSR + CSR to render pages.  
It is very opionated and has set of idiomatic ways of doing things.  
It has an inbuilt rpc mechanism to access server resources instead of a typical REST API.  
It aims to have almost the same router api as nextjs router for ease of use.  

During development each request for a page is executed in a separate edge-runtime (miniflare/vercel) vm.  
During production each page is packaged to an esm function adapted to the platform of your choice.  

## Why?
* Its really hard to have a streaming SSR + CSR with automatic data rehydration setup in nextjs 13.  
* There is no meta-framework which runs your code in an edge simulated environment during development.  

## Requirements
1. `node >= v20`
2. `wrangler` for deploying to cloudflare page functions
3. `vercel` for deploying to vercel edge runtime

## DB access
Since it runs only on edge runtimes which run in a constrained browser environment, you have to use database drivers
which can run in the browser, basically utilize Ajax/Fetch/Websocket. Here is a list of some of them,

* [NeonDB serverless driver](https://github.com/neondatabase/serverless) - postgres
* [Platnetscale serverless driver](https://planetscale.com/docs/tutorials/planetscale-serverless-driver) - mysql
* [Mongo Http](https://github.com/patrick-kw-chiu/mongo-http.js) - mongodb


### Supported platforms
1. [Cloudflare page functions](https://developers.cloudflare.com/pages/platform/functions/routing/)
2. [TODO][Vercel edge functions](https://vercel.com/docs/concepts/functions/edge-functions)
3. [TODO][Netlify edge functions](https://docs.netlify.com/edge-functions/overview/)

## Developing

1. `node >= v20.2.0`
2. `pnpm >= v8.5.1`

### Todo[General]
1. Build a docs website
2. Add tests for bot
3. Add tests for runtime
4. Add E2E tests for example
5. Maybe move to vite for HMR goodness

### Todo[Cloudflare]
1. Fix 404 pages not routing on server