import tailwindcss from '@tailwindcss/vite'

const defaultDevPort = Number.parseInt(process.env.NUXT_DEV_PORT || '3000', 10)
const defaultSiteProtocol = process.env.NUXT_PUBLIC_SITE_PROTOCOL || (process.env.NODE_ENV === 'development' ? 'http' : 'https')
const isDevelopment = process.env.NODE_ENV === 'development'
const hostAwareRouteCache = {
  maxAge: 300,
  swr: true,
  varies: ['host', 'x-forwarded-host']
}

export default defineNuxtConfig({
  ssr: true,
  devtools: { enabled: true },
  css: ['~/app/assets/css/main.css'],
  devServer: {
    host: process.env.NUXT_DEV_HOST || '0.0.0.0',
    port: Number.isNaN(defaultDevPort) ? 3000 : defaultDevPort
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['.localhost']
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  runtimeConfig: {
    publicApiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://public-api.localhost',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://public-api.localhost',
      platformBaseDomain: process.env.NUXT_PUBLIC_PLATFORM_BASE_DOMAIN || 'public.localhost:3000',
      siteProtocol: defaultSiteProtocol
    }
  },
  routeRules: isDevelopment
    ? {}
    : {
        '/': {
          cache: hostAwareRouteCache
        },
        '/**': {
          cache: hostAwareRouteCache
        },
        '/robots.txt': {
          cache: {
            maxAge: 3600,
            swr: true,
            varies: ['host', 'x-forwarded-host']
          }
        },
        '/sitemap.xml': {
          cache: {
            maxAge: 3600,
            swr: true,
            varies: ['host', 'x-forwarded-host']
          }
        }
      },
  compatibilityDate: '2025-01-01'
})
