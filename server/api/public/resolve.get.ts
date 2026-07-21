export default defineEventHandler(async (event) => {
  const { host, path } = getQuery(event) as {
    host?: string
    path?: string
  }
  const config = useRuntimeConfig()
  return await $fetch(`${config.publicApiBase}/api/public/resolve`, {
    params: { host, path },
  })
})
