import { describe, expect, it } from 'vitest'
import { collectHeaderSheet, utilitySectionTitle, utilitySheetSections } from '~/lib/headerSheet'
import type { PublicBlockNode, PublicMenu } from '~/types/public'

// The shape the generator ships (site-generator header_footer._logo_mark +
// chrome-header-*): a "Header bar" holding the typographic brand mark, the
// primary nav, a utility-slot language menu and, on some sites, a CTA.
function header(children: PublicBlockNode[]): PublicBlockNode[] {
  return [{ id: 'header', type: 'header', children: [{ id: 'bar', name: 'Header bar', type: 'container', children }] }]
}

const BRAND: PublicBlockNode = {
  id: 'brand',
  name: 'Brand',
  type: 'container',
  children: [
    { id: 'mark', name: 'Mark', type: 'container', children: [{ id: 'mono', type: 'text', content: { innerText: 'U' } }] },
    { id: 'wordmark', name: 'Wordmark', type: 'link', content: { innerText: 'Unique Kindies', href: '/' } },
  ],
}
const PRIMARY: PublicBlockNode = { id: 'nav', type: 'menu', content: { slot: 'primary', menuLabel: 'Main' } }
const LANGUAGE_NODE: PublicBlockNode = {
  id: 'lang',
  name: 'Language menu',
  type: 'menu',
  content: { slot: 'utility', variant: 'utility-inline', menuLabel: 'Language' },
}
const CTA: PublicBlockNode = { id: 'cta', name: 'Header CTA', type: 'link', content: { innerText: 'Book a visit', href: '/contact' } }

const LANGUAGE_MENU: PublicMenu = {
  id: 'menu-utility',
  name: 'Language',
  purpose: 'language',
  items: [
    { id: 'en', label: 'English', locale: 'en', href: '/' },
    { id: 'zh', label: '中文', locale: 'zh-Hans', href: '/zh' },
  ],
}
const MENUS: PublicMenu[] = [
  { id: 'menu-primary', name: 'Main', purpose: 'primary', items: [{ id: 'about', label: 'About', href: '/about' }] },
  LANGUAGE_MENU,
]

describe('collectHeaderSheet — action links', () => {
  it('never offers the typographic brand mark as the sheet button', () => {
    const sheet = collectHeaderSheet(header([BRAND, PRIMARY, LANGUAGE_NODE]), MENUS, 'nav')
    expect(sheet.actionLinks).toEqual([])
  })

  it('keeps a real CTA beside the brand mark', () => {
    const sheet = collectHeaderSheet(header([BRAND, PRIMARY, CTA]), MENUS, 'nav')
    expect(sheet.actionLinks.map((link) => link.label)).toEqual(['Book a visit'])
  })

  it('treats a link to the site root as the home link, whatever it is named', () => {
    const home: PublicBlockNode = { id: 'home', name: 'Logo link', type: 'link', content: { innerText: 'Acme', href: '/' } }
    expect(collectHeaderSheet(header([home, CTA]), MENUS).actionLinks.map((link) => link.id)).toEqual(['cta'])
  })

  it('shields only a node named exactly "Brand" — a "Header brand row" still holds the CTA', () => {
    const row: PublicBlockNode = { id: 'row', name: 'Header brand row', type: 'container', children: [BRAND, CTA] }
    expect(collectHeaderSheet(header([row]), MENUS).actionLinks.map((link) => link.id)).toEqual(['cta'])
  })

  it('skips hidden nodes and the rendering menu itself', () => {
    const hidden = { ...CTA, id: 'hidden', visible: false } as PublicBlockNode
    const sheet = collectHeaderSheet(header([PRIMARY, hidden]), MENUS, 'nav')
    expect(sheet.actionLinks).toEqual([])
    expect(sheet.menus).toEqual([])
  })
})

describe('utility sections', () => {
  it('heads a language menu with its own name, never "Utility"', () => {
    const sheet = collectHeaderSheet(header([BRAND, PRIMARY, LANGUAGE_NODE]), MENUS, 'nav')
    const sections = utilitySheetSections(sheet.menus)
    expect(sections.map((section) => section.title)).toEqual(['Language'])
    expect(sections[0]!.items.map((item) => item.label)).toEqual(['English', '中文'])
  })

  it('gives an unnamed language menu no heading at all', () => {
    expect(utilitySectionTitle({ purpose: 'language', name: '  ', items: [] })).toBeNull()
  })

  it('keeps every other utility menu in the one "Utility" list it always had', () => {
    const menus: PublicMenu[] = [
      { id: 'u1', name: 'Account', purpose: 'account', items: [{ id: 'login', label: 'Log in', href: '/login' }] },
      { id: 'u2', name: 'Help', purpose: 'help', items: [{ id: 'faq', label: 'FAQ', href: '/faq' }] },
      LANGUAGE_MENU,
    ]
    const nodes = header([
      { id: 'a', type: 'menu', content: { slot: 'utility', menuId: 'u1' } },
      LANGUAGE_NODE,
      { id: 'b', type: 'menu', content: { variant: 'utility-inline', menuId: 'u2' } },
    ])
    const sections = utilitySheetSections(collectHeaderSheet(nodes, menus).menus)
    expect(sections.map((section) => [section.title, section.items.map((item) => item.label)])).toEqual([
      ['Utility', ['Log in', 'FAQ']],
      ['Language', ['English', '中文']],
    ])
  })

  it('leaves out a menu that is not in the utility slot, and an empty one', () => {
    const nodes = header([PRIMARY, { ...LANGUAGE_NODE, id: 'lang2' }])
    const sections = utilitySheetSections(collectHeaderSheet(nodes, [{ ...LANGUAGE_MENU, items: [] }]).menus)
    expect(sections).toEqual([])
  })
})
