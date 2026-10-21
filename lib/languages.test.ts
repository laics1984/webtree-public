import { describe, expect, it } from 'vitest'
import { hreflangLinks, languageAttrs, resolveLanguageMenus, sitemapAlternates } from '~/lib/languages'
import type { PublicMenu } from '~/types/public'

const ALTERNATES = [
  { locale: 'en', path: '/about', href: 'https://tadika.test/about' },
  { locale: 'ms', path: '/bm/about', href: 'https://tadika.test/bm/about' },
]

describe('languageAttrs', () => {
  it('names the language and its direction', () => {
    expect(languageAttrs('zh-Hans')).toEqual({ lang: 'zh-Hans', dir: 'ltr' })
    expect(languageAttrs('ar')).toEqual({ lang: 'ar', dir: 'rtl' })
    expect(languageAttrs('ur-PK')).toEqual({ lang: 'ur-PK', dir: 'rtl' })
  })

  it('states nothing without a language', () => {
    expect(languageAttrs(null)).toEqual({})
  })
})

describe('hreflangLinks', () => {
  it('is reciprocal, includes the page itself, and points x-default at the primary page', () => {
    expect(hreflangLinks(ALTERNATES)).toEqual([
      { rel: 'alternate', hreflang: 'en', href: 'https://tadika.test/about' },
      { rel: 'alternate', hreflang: 'ms', href: 'https://tadika.test/bm/about' },
      { rel: 'alternate', hreflang: 'x-default', href: 'https://tadika.test/about' },
    ])
  })

  it('states nothing for a page in one language, or without absolute URLs', () => {
    expect(hreflangLinks([])).toEqual([])
    expect(hreflangLinks([ALTERNATES[0]!])).toEqual([])
    expect(hreflangLinks(ALTERNATES.map((alt) => ({ ...alt, href: null })))).toEqual([])
  })
})

describe('resolveLanguageMenus', () => {
  const menus: PublicMenu[] = [
    { id: 'menu-primary', purpose: 'primary', items: [{ id: 'about', label: 'About', href: '/about' }] },
    {
      id: 'menu-language',
      purpose: 'language',
      items: [
        { id: 'en', label: 'English', locale: 'en', href: '/' },
        { id: 'ms', label: 'Bahasa Malaysia', locale: 'ms', href: '/bm' },
        { id: 'zh', label: '中文', locale: 'zh-Hans', href: '/zh' },
      ],
    },
  ]

  it("links each language to the reader's page and marks the current one", () => {
    const [, language] = resolveLanguageMenus(menus, ALTERNATES, 'ms')
    expect(language!.items).toEqual([
      { id: 'en', label: 'English', locale: 'en', href: '/about', hreflang: 'en', lang: 'en', current: false, children: null },
      { id: 'ms', label: 'Bahasa Malaysia', locale: 'ms', href: '/bm/about', hreflang: 'ms', lang: 'ms', current: true, children: null },
    ])
  })

  it('leaves out a language the page is not published in', () => {
    const [, language] = resolveLanguageMenus(menus, ALTERNATES, 'en')
    expect(language!.items!.map((item) => item.locale)).toEqual(['en', 'ms'])
  })

  it('shows no language menu on a page in one language', () => {
    const [, language] = resolveLanguageMenus(menus, [], 'en')
    expect(language!.items).toEqual([])
  })

  it('passes every other menu through untouched', () => {
    const [primary] = resolveLanguageMenus(menus, ALTERNATES, 'ms')
    expect(primary).toBe(menus[0])
    const plain = [menus[0]!]
    expect(resolveLanguageMenus(plain, ALTERNATES, 'ms')).toBe(plain)
  })
})

describe('sitemapAlternates', () => {
  it('builds absolute links for every language plus x-default', () => {
    const links = sitemapAlternates(
      [{ locale: 'en', path: '/' }, { locale: 'zh-Hans', path: '/zh' }],
      (path) => `https://tadika.test${path}`
    )
    expect(links).toEqual([
      { hreflang: 'en', href: 'https://tadika.test/' },
      { hreflang: 'zh-Hans', href: 'https://tadika.test/zh' },
      { hreflang: 'x-default', href: 'https://tadika.test/' },
    ])
  })

  it('is empty for a page in one language', () => {
    expect(sitemapAlternates([{ locale: 'en', path: '/' }], (p) => p)).toEqual([])
  })
})
