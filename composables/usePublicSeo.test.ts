import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createHead, renderSSRHead } from 'unhead/server'
import type { PublicPageResponse } from '~/types/public'
import { usePublicSeo } from './usePublicSeo'

vi.mock('~/lib/host', async (importOriginal) => ({ ...await importOriginal<typeof import('~/lib/host')>(), getRequestHost: () => 'school.example.com' }))

afterEach(() => vi.unstubAllGlobals())

describe('Google site verification in server-rendered metadata', () => {
  it('retains multiple owners’ tags while rejecting HTML and keeping the existing indexing policy', async () => {
    const head = createHead()
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { siteProtocol: 'https', platformBaseDomain: 'public.example.com' } }))
    vi.stubGlobal('useHostIndexing', () => false)
    vi.stubGlobal('useHead', (factory: () => object) => head.push(factory()))
    const payload = ref({
      entity: { resolvedHost: 'school.example.com', canonicalHost: 'school.example.com', name: 'School' },
      site: { googleSiteVerification: ['owner-one', 'owner_two', '<script>bad</script>'] },
      page: { title: 'Home', path: '/' },
    } as unknown as PublicPageResponse)
    usePublicSeo(payload)
    const rendered = await renderSSRHead(head)
    expect(rendered.headTags.match(/name="google-site-verification"/g)).toHaveLength(2)
    expect(rendered.headTags).toContain('content="owner-one"')
    expect(rendered.headTags).toContain('content="owner_two"')
    expect(rendered.headTags).not.toContain('bad')
    expect(rendered.headTags).toContain('noindex, nofollow')
  })

  it('accepts an older API payload without verification metadata', async () => {
    const head = createHead()
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { siteProtocol: 'https', platformBaseDomain: 'public.example.com' } }))
    vi.stubGlobal('useHostIndexing', () => true)
    vi.stubGlobal('useHead', (factory: () => object) => head.push(factory()))
    usePublicSeo(ref({ entity: { name: 'School' }, site: {}, page: { title: 'Home' } } as unknown as PublicPageResponse))
    expect((await renderSSRHead(head)).headTags).not.toContain('google-site-verification')
  })
})
