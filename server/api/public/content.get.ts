export default defineEventHandler(async (event) => {
  const { host, type, slug } = getQuery(event) as {
    host?: string
    type?: string
    slug?: string
  }
  const config = useRuntimeConfig()
  return await $fetch(`${config.publicApiBase}/api/public/content`, {
    params: { host, type, slug },
  })
})
