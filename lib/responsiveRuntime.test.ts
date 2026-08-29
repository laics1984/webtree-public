import { describe, expect, it } from 'vitest'
import { buildResponsiveStylesheet, getResponsiveNodeStyles } from '~/lib/responsiveRuntime'

// A generated header, in the shape every chrome-header-* catalog entry
// produces: the header root's children are wrapped in a "Header bar"
// container. That wrapper is why the header rules keyed on
// `parentType === 'header'` were dead — see the comment on `inHeader`.
const headerBar = (children: unknown[]) => ({
  id: 'root',
  name: 'Site Header',
  type: '__header',
  styles: { width: '100%' },
  content: [
    {
      id: 'bar',
      name: 'Header bar',
      type: 'container',
      styles: { display: 'flex', justifyContent: 'space-between', width: '100%' },
      content: children,
    },
  ],
})

const imageLogo = (height = '52px') => ({
  id: 'logo',
  name: 'Brand Logo',
  type: 'image',
  styles: { height, width: 'auto', display: 'block' },
  content: { src: 'https://example.com/logo.png', alt: 'Acme' },
})

// The typographic fallback: a container named "Brand" whose wordmark is a LINK.
const wordmarkLogo = () => ({
  id: 'brand',
  name: 'Brand',
  type: 'container',
  styles: { flexDirection: 'row', alignItems: 'center' },
  content: [
    {
      id: 'wordmark',
      name: 'Wordmark',
      type: 'link',
      styles: { fontSize: '18px' },
      content: { innerText: 'Acme', href: '/' },
    },
  ],
})

const cta = () => ({
  id: 'cta',
  name: 'Header CTA',
  type: 'link',
  styles: { display: 'inline-flex', backgroundColor: '#2563eb' },
  content: { innerText: 'Get in touch', href: '/contact' },
})

const menu = () => ({
  id: 'menu',
  name: 'Menu',
  type: 'menu',
  styles: { width: '100%', flex: '1 1 0%' },
  content: { slot: 'primary', variant: 'header-inline' },
})

const nodeStyles = (node: unknown, device: 'Mobile' | 'Tablet') =>
  getResponsiveNodeStyles(node, device, undefined, { scope: 'header' })

describe('header chrome below the desktop breakpoint', () => {
  // Mobile and tablet are exactly the range where MenuBlock swaps the nav for
  // the Menu button (`max-width: 1023.98px` = the two device queries this
  // module emits), so the rules have to hold for both.
  for (const device of ['Mobile', 'Tablet'] as const) {
    it(`hides the header CTA on ${device}`, () => {
      const css = buildResponsiveStylesheet({ headerSchema: [headerBar([imageLogo(), menu(), cta()])] })
      expect(css).toContain('[data-wt-node-id="cta"]')
      const rule = css.split('\n').find((line) => line.includes('data-wt-node-id="cta"'))
      expect(rule).toContain('display: none')
    })

    it(`keeps the brand wordmark visible on ${device}`, () => {
      // The wordmark is a `link` in the header too. Hiding it would erase the
      // site's name from every narrow screen.
      const css = buildResponsiveStylesheet({ headerSchema: [headerBar([wordmarkLogo(), menu(), cta()])] })
      const rule = css.split('\n').find((line) => line.includes('data-wt-node-id="wordmark"'))
      expect(rule ?? '').not.toContain('display: none')
    })

    it(`shrinks the brand logo on ${device}`, () => {
      expect(nodeStyles(imageLogo('52px'), device).height).toBe('42px')
      // width stays auto so the mark keeps its aspect ratio
      expect(nodeStyles(imageLogo('52px'), device).width).toBe('auto')
    })

    it(`caps an oversized mark at the Menu button's height on ${device}`, () => {
      // childcare's 68px is 54px at 0.8 — still a banner beside a 44px pill.
      expect(nodeStyles(imageLogo('68px'), device).height).toBe('44px')
    })

    it(`lets the schema state its own compact size on ${device}`, () => {
      const pinned = { ...imageLogo('52px'), responsiveStyles: { mobile: { height: '30px' }, tablet: { height: '30px' } } }
      expect(nodeStyles(pinned, device).height).toBe('30px')
    })
  }

  it('leaves the desktop header alone', () => {
    // The CTA belongs in the bar wherever the nav itself is in the bar.
    const css = buildResponsiveStylesheet({ headerSchema: [headerBar([imageLogo(), menu(), cta()])] })
    const desktop = css.split('@media (min-width: 1024px)')[1]?.split('@media')[0] ?? ''
    expect(desktop).not.toContain('data-wt-node-id="cta"')
    expect(desktop).not.toContain('data-wt-node-id="logo"')
  })

  it('hides a CTA nested in a layout row named after the brand', () => {
    // chrome-header-centered-stack: "Header brand row" holds the mark AND the
    // CTA. A loose `/brand/i` subtree test shields the CTA from its own rule.
    const nested = headerBar([
      {
        id: 'brandrow',
        name: 'Header brand row',
        type: 'container',
        styles: { display: 'flex' },
        content: [imageLogo(), { id: 'actions', name: 'Header actions', type: 'container', styles: {}, content: [cta()] }],
      },
    ])
    const css = buildResponsiveStylesheet({ headerSchema: [nested] })
    const rule = css.split('\n').find((line) => line.includes('data-wt-node-id="cta"'))
    expect(rule).toContain('display: none')
  })

  it('keeps a header link that points at the site root', () => {
    // The image mark carries `href: '/'` on the node itself, and a bare
    // wordmark may sit outside a "Brand" wrapper entirely.
    const home = { ...cta(), id: 'home', content: { innerText: 'Acme', href: '/' } }
    const css = buildResponsiveStylesheet({ headerSchema: [headerBar([home, menu()])] })
    const rule = css.split('\n').find((line) => line.includes('data-wt-node-id="home"'))
    expect(rule ?? '').not.toContain('display: none')
  })

  it('halves the screen gutter on a phone, but not on a tablet', () => {
    const bar = (styles: Record<string, string>) => ({
      id: 'root', name: 'Site Header', type: '__header', styles: {},
      content: [{ id: 'bar', name: 'Header bar', type: 'container', styles, content: [imageLogo(), menu()] }],
    })
    const css = buildResponsiveStylesheet({
      headerSchema: [bar({ display: 'flex', paddingLeft: '24px', paddingRight: '24px', paddingTop: '24px' })],
    })
    const phone = css.split('@media (max-width: 767.98px)')[1] ?? ''
    const tablet = css.split('@media (min-width: 768px)')[1]?.split('@media')[0] ?? ''
    expect(phone).toContain('padding-left: 12px')
    expect(phone).toContain('padding-right: 12px')
    // vertical padding is the scroll shrink's business, not the gutter's
    expect(phone).toContain('padding-top: 24px')
    expect(tablet).toContain('padding-left: 24px')
  })

  it('insets only the outermost padded layer', () => {
    // floating-pill: the root carries the screen gutter, the bar's own padding
    // is the capsule's shape. Shrinking both would re-style the archetype.
    const pill = {
      id: 'root', name: 'Site Header', type: '__header',
      styles: { paddingLeft: '24px', paddingRight: '24px' },
      content: [{
        id: 'bar', name: 'Header bar', type: 'container',
        styles: { display: 'flex', paddingLeft: '20px', paddingRight: '20px' },
        content: [imageLogo(), menu()],
      }],
    }
    const phone = buildResponsiveStylesheet({ headerSchema: [pill] }).split('@media (max-width: 767.98px)')[1] ?? ''
    const rootRule = phone.split('\n').find((l) => l.includes('"root"')) ?? ''
    const barRule = phone.split('\n').find((l) => l.includes('"bar"')) ?? ''
    expect(rootRule).toContain('padding-left: 12px')
    expect(barRule).toContain('padding-left: 20px')
  })

  it('never grows a gutter that is already tight', () => {
    const tight = getResponsiveNodeStyles(
      { id: 'bar', name: 'Header bar', type: 'container', styles: { display: 'flex', paddingLeft: '8px' } },
      'Mobile', undefined, { scope: 'header' }
    )
    expect(tight.paddingLeft).toBe('8px')
  })

  it('does not touch links outside the header', () => {
    const styles = getResponsiveNodeStyles(cta(), 'Mobile', undefined, { scope: 'body' })
    expect(styles.display).toBe('inline-flex')
  })
})
