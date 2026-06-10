export default defineEventHandler(async (event) => {
  const { host, type, count, current, categorySlug, taxonomyType, taxonomySlug } = getQuery(event) as {
    host?: string
    type?: 'article' | 'event'
    count?: string
    current?: string
    categorySlug?: string
    taxonomyType?: 'category' | 'tag'
    taxonomySlug?: string
  }
  const config = useRuntimeConfig()
  return await $fetch(`${config.publicApiBase}/api/public/content-list`, {
    params: { host, type, count, current, categorySlug, taxonomyType, taxonomySlug },
  })
})
