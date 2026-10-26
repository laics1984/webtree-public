export default defineEventHandler(async (event) => {
  const { host, type, slug } = getQuery(event) as {
    host?: string
    type?: string
    slug?: string
  }
  return await fetchPublicApi(event, 'content', { host, type, slug })
})
