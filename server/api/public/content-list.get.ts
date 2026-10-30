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
  return await fetchPublicApi(event, 'content-list', { host, type, count, current, categorySlug, taxonomyType, taxonomySlug })
})
