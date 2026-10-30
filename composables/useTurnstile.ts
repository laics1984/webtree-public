import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Cloudflare Turnstile on the contact form, only when NUXT_PUBLIC_TURNSTILE_SITE_KEY is set. The CMS checks the
 * token once its TURNSTILE_SECRET_KEY is set, so set the site key here first. Rendered explicitly into `container`
 * in the browser; `token` holds the current single-use token, and `reset()` asks for a fresh one after a submission.
 */

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      loading = null
      reject(new Error('Turnstile could not be loaded'))
    }
    document.head.appendChild(script)
  })
  return loading
}

export function useTurnstile(container: Ref<HTMLElement | null>) {
  const siteKey = String(useRuntimeConfig().public.turnstileSiteKey || '')
  const token = ref('')
  let widgetId: string | undefined

  onMounted(async () => {
    if (!siteKey || !container.value) return
    try {
      await loadScript()
      widgetId = window.turnstile?.render(container.value, {
        sitekey: siteKey,
        callback: (value: string) => {
          token.value = value
        },
        'expired-callback': () => {
          token.value = ''
        },
        'error-callback': () => {
          token.value = ''
        },
      })
    } catch {
      // Without a token the CMS refuses the submission, and the form shows its message.
    }
  })

  onBeforeUnmount(() => {
    if (widgetId !== undefined) window.turnstile?.remove(widgetId)
  })

  function reset() {
    token.value = ''
    if (widgetId !== undefined) window.turnstile?.reset(widgetId)
  }

  return { enabled: siteKey !== '', token, reset }
}
