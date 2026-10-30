export default defineEventHandler(async (event) => {
  const { host, path } = getQuery(event) as { host?: string; path?: string }
  return await fetchPublicApi(event, 'page', { host, path })
})
