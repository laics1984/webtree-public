export default defineEventHandler(async (event) => {
  const { host, type } = getQuery(event) as { host?: string; type?: string }
  return await fetchPublicApi(event, 'template', { host, type })
})
