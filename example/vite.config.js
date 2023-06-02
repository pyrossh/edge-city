import { defineConfig } from 'vite';

function pagesPlugin(userOptions) {
  return {
    name: 'vite-plugin-pages',
    enforce: 'pre',
    async configResolved(config) {
      userOptions.resolver = 'react'
      ctx = new PageContext(userOptions, config.root)
      ctx.setLogger(config.logger)
      await ctx.searchGlob()
    },
    api: {
      getResolvedRoutes() {
        return ctx.options.resolver.getComputedRoutes(ctx)
      },
    },
    configureServer(server) {
      ctx.setupViteServer(server)
    },
    resolveId(id) {
      if (ctx.options.moduleIds.includes(id))
        return `${MODULE_ID_VIRTUAL}?id=${id}`

      if (routeBlockQueryRE.test(id))
        return ROUTE_BLOCK_ID_VIRTUAL

      return null
    },
    async load(id) {
      const {
        moduleId,
        pageId,
      } = parsePageRequest(id)

      if (moduleId === MODULE_ID_VIRTUAL && pageId && ctx.options.moduleIds.includes(pageId))
        return ctx.resolveRoutes()

      if (id === ROUTE_BLOCK_ID_VIRTUAL) {
        return {
          code: 'export default {};',
          map: null,
        }
      }

      return null
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
  ],
})
