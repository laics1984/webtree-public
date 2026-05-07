export default defineEventHandler(async (event) => {
  const { host, type } = getQuery(event) as { host?: string; type?: string }
  const config = useRuntimeConfig()
  return await $fetch(`${config.publicApiBase}/api/public/template`, {
    params: { host, type },
  })
})
