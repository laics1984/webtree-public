export default defineEventHandler(async (event) => {
  const { host } = getQuery(event) as { host?: string }
  return await fetchPublicApi(event, 'site', { host })
})
