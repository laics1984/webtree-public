import { describe, expect, it } from 'vitest'
import { renderCmsBodyToHtml } from './cmsRichText'

const body = (nodes: unknown) => JSON.stringify(nodes)

describe('renderCmsBodyToHtml', () => {
  it('renders paragraphs and inline marks', () => {
    expect(
      renderCmsBodyToHtml(
        body([
          {
            type: 'paragraph',
            children: [{ text: 'Plain ' }, { text: 'bold', bold: true }],
          },
        ])
      )
    ).toBe('<p>Plain <strong>bold</strong></p>')
  })

  it('escapes markup in author text', () => {
    expect(
      renderCmsBodyToHtml(
        body([{ type: 'paragraph', children: [{ text: '<script>x</script>' }] }])
      )
    ).toBe('<p>&lt;script&gt;x&lt;/script&gt;</p>')
  })

  it('marks an empty paragraph so it keeps its line box', () => {
    expect(
      renderCmsBodyToHtml(body([{ type: 'paragraph', children: [{ text: '' }] }]))
    ).toBe('<p class="wt-rich-empty-paragraph"><br /></p>')
  })

  describe('block alignment', () => {
    // Regression: `align` was read for images only, so a centred paragraph
    // published left-aligned.
    it.each([
      ['left', 'wt-rich-align-left'],
      ['center', 'wt-rich-align-center'],
      ['right', 'wt-rich-align-right'],
      ['justify', 'wt-rich-align-justify'],
    ])('carries %s onto the paragraph', (align, className) => {
      expect(
        renderCmsBodyToHtml(
          body([{ type: 'paragraph', align, children: [{ text: 'Hi' }] }])
        )
      ).toBe(`<p class="${className}">Hi</p>`)
    })

    it('carries alignment onto headings and list items', () => {
      expect(
        renderCmsBodyToHtml(
          body([
            { type: 'heading-one', align: 'center', children: [{ text: 'T' }] },
            {
              type: 'bulleted-list',
              children: [
                { type: 'list-item', align: 'right', children: [{ text: 'a' }] },
              ],
            },
          ])
        )
      ).toBe(
        '<h1 class="wt-rich-align-center">T</h1>' +
          '<ul><li class="wt-rich-align-right">a</li></ul>'
      )
    })

    it('ignores an alignment it does not recognise', () => {
      expect(
        renderCmsBodyToHtml(
          body([{ type: 'paragraph', align: 'sideways', children: [{ text: 'x' }] }])
        )
      ).toBe('<p>x</p>')
    })

    it('still aligns an empty paragraph, keeping both classes', () => {
      expect(
        renderCmsBodyToHtml(
          body([{ type: 'paragraph', align: 'center', children: [{ text: '' }] }])
        )
      ).toBe('<p class="wt-rich-empty-paragraph wt-rich-align-center"><br /></p>')
    })
  })

  describe('headings and lists', () => {
    it('renders both editor and plain-HTML type names', () => {
      expect(
        renderCmsBodyToHtml(
          body([
            { type: 'heading-two', children: [{ text: 'A' }] },
            { type: 'h2', children: [{ text: 'B' }] },
            { type: 'numbered-list', children: [{ type: 'li', children: [{ text: 'c' }] }] },
          ])
        )
      ).toBe('<h2>A</h2><h2>B</h2><ol><li>c</li></ol>')
    })

    it('falls back to a paragraph for an unknown block, keeping the text', () => {
      expect(
        renderCmsBodyToHtml(body([{ type: 'mystery', children: [{ text: 'kept' }] }]))
      ).toBe('<p>kept</p>')
    })
  })

  describe('tables', () => {
    const table = (rows: unknown[]) => ({ type: 'table', children: rows })
    const row = (cells: unknown[]) => ({ type: 'table-row', children: cells })
    const cell = (text: string, header = false) => ({
      type: 'table-cell',
      header,
      children: [{ text }],
    })

    it('renders a header row into thead with scoped th', () => {
      expect(
        renderCmsBodyToHtml(
          body([
            table([
              row([cell('Name', true), cell('Qty', true)]),
              row([cell('Bolt'), cell('12')]),
            ]),
          ])
        )
      ).toBe(
        '<div class="wt-rich-table-wrap"><table class="wt-rich-table">' +
          '<thead><tr><th scope="col">Name</th><th scope="col">Qty</th></tr></thead>' +
          '<tbody><tr><td>Bolt</td><td>12</td></tr></tbody>' +
          '</table></div>'
      )
    })

    it('renders every row into tbody when there is no header', () => {
      expect(
        renderCmsBodyToHtml(body([table([row([cell('a')]), row([cell('b')])])]))
      ).toBe(
        '<div class="wt-rich-table-wrap"><table class="wt-rich-table">' +
          '<tbody><tr><td>a</td></tr><tr><td>b</td></tr></tbody>' +
          '</table></div>'
      )
    })

    it('drops non-cell children rather than emitting invalid markup', () => {
      const html = renderCmsBodyToHtml(
        body([
          table([
            { type: 'table-row', children: [{ type: 'paragraph', children: [{ text: 'stray' }] }, cell('kept')] },
          ]),
        ])
      )
      expect(html).toContain('<td>kept</td>')
      expect(html).not.toContain('<p>')
    })

    it('emits nothing for a table with no usable rows', () => {
      expect(renderCmsBodyToHtml(body([table([])]))).toBe('')
      expect(renderCmsBodyToHtml(body([table([row([])])]))).toBe('')
    })

    it('escapes cell text', () => {
      expect(
        renderCmsBodyToHtml(body([table([row([cell('a & <b>')])])]))
      ).toContain('<td>a &amp; &lt;b&gt;</td>')
    })
  })

  describe('images', () => {
    it('resolves the asset url and renders a caption', () => {
      expect(
        renderCmsBodyToHtml(
          body([{ type: 'image', url: 'pic.jpg', caption: 'A pic', children: [{ text: '' }] }]),
          (src) => `https://cdn.test/${src}`
        )
      ).toBe(
        '<figure class="wt-rich-image wt-rich-image--align-center">' +
          '<img src="https://cdn.test/pic.jpg" alt="" loading="lazy" />' +
          '<figcaption>A pic</figcaption></figure>'
      )
    })

    it('emits nothing for an image with no source', () => {
      expect(renderCmsBodyToHtml(body([{ type: 'image', children: [{ text: '' }] }]))).toBe('')
    })
  })

  describe('malformed input', () => {
    it('returns an empty string for empty input', () => {
      expect(renderCmsBodyToHtml('')).toBe('')
      expect(renderCmsBodyToHtml(null)).toBe('')
      expect(renderCmsBodyToHtml(undefined)).toBe('')
    })

    it('passes non-JSON bodies through untouched', () => {
      expect(renderCmsBodyToHtml('<p>legacy html</p>')).toBe('<p>legacy html</p>')
    })
  })
})

/**
 * Parity fixture.
 *
 * The twin of this test lives in the builder repo at
 * src/lib/cms-rich-text.test.ts and runs the same document through the canvas
 * preview's copy of this renderer. The two expectations are identical but for
 * the class prefix (`wt-rich-` here, `cms-rich-` there), so a node type handled
 * in one copy and not the other fails here instead of quietly making the canvas
 * stop matching the page. Change one, change both.
 */
const PARITY_DOCUMENT = [
  { type: 'heading-one', align: 'center', children: [{ text: 'Title' }] },
  {
    type: 'paragraph',
    children: [{ text: 'Some ' }, { text: 'bold', bold: true }, { text: ' text' }],
  },
  { type: 'paragraph', children: [{ text: '' }] },
  { type: 'block-quote', children: [{ text: 'A quote' }] },
  {
    type: 'bulleted-list',
    children: [{ type: 'list-item', align: 'right', children: [{ text: 'Item' }] }],
  },
  {
    type: 'table',
    children: [
      {
        type: 'table-row',
        children: [{ type: 'table-cell', header: true, children: [{ text: 'H' }] }],
      },
      {
        type: 'table-row',
        children: [{ type: 'table-cell', children: [{ text: 'C' }] }],
      },
    ],
  },
  { type: 'paragraph', align: 'justify', children: [{ text: 'End' }] },
]

describe('builder parity', () => {
  it('renders the shared fixture the same shape the canvas preview does', () => {
    expect(renderCmsBodyToHtml(JSON.stringify(PARITY_DOCUMENT))).toBe(
      '<h1 class="wt-rich-align-center">Title</h1>' +
        '<p>Some <strong>bold</strong> text</p>' +
        '<p class="wt-rich-empty-paragraph"><br /></p>' +
        '<blockquote>A quote</blockquote>' +
        '<ul><li class="wt-rich-align-right">Item</li></ul>' +
        '<div class="wt-rich-table-wrap"><table class="wt-rich-table">' +
        '<thead><tr><th scope="col">H</th></tr></thead>' +
        '<tbody><tr><td>C</td></tr></tbody>' +
        '</table></div>' +
        '<p class="wt-rich-align-justify">End</p>'
    )
  })
})
