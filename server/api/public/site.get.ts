export default defineEventHandler(async (event) => {
  const { host } = getQuery(event) as { host?: string }
  const config = useRuntimeConfig()
  return await $fetch(`${config.publicApiBase}/api/public/site`, {
    params: { host }
  })
})
