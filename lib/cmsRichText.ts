export type CmsRichTextNode = {
  type?: string
  text?: string
  children?: CmsRichTextNode[]
  url?: string
  src?: string
  alt?: string
  caption?: string
  align?: string
  fullWidth?: boolean
  header?: boolean
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
}

type ResolveAssetUrl = (src: string) => string

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const escapeAttribute = (value: string) =>
  escapeHtml(value).replace(/"/g, '&quot;')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getNodeText = (nodes: CmsRichTextNode[] | undefined): string =>
  Array.isArray(nodes)
    ? nodes.map((node) => node.text ?? getNodeText(node.children)).join('')
    : ''

const renderTextNode = (node: CmsRichTextNode): string => {
  let html = escapeHtml(node.text ?? '')

  if (!html) return ''

  if (node.code) html = `<code>${html}</code>`
  if (node.bold) html = `<strong>${html}</strong>`
  if (node.italic) html = `<em>${html}</em>`
  if (node.underline) html = `<u>${html}</u>`
  if (node.strikethrough) html = `<s>${html}</s>`

  return html
}

const renderChildList = (
  children: CmsRichTextNode[] | undefined,
  resolveAssetUrl: ResolveAssetUrl
) =>
  Array.isArray(children)
    ? children.map((child) => renderNode(child, resolveAssetUrl)).join('')
    : ''

/**
 * Children of a block that must not collapse to nothing. An empty paragraph or
 * cell keeps its line box only if something occupies it.
 */
const renderChildren = (
  children: CmsRichTextNode[] | undefined,
  resolveAssetUrl: ResolveAssetUrl
) => renderChildList(children, resolveAssetUrl) || '<br />'

const isEmptyParagraph = (node: CmsRichTextNode) =>
  node.type === 'paragraph' &&
  (!Array.isArray(node.children) ||
    node.children.every((child) => getNodeText([child]).trim() === ''))

const ALIGNMENTS = new Set(['left', 'center', 'right', 'justify'])

/**
 * Block alignment, which the editor writes onto paragraphs, headings and list
 * items and which this used to read for images only — so an author could centre
 * a paragraph, see it centred while writing, and publish it left-aligned.
 */
const alignClass = (node: CmsRichTextNode) =>
  typeof node.align === 'string' && ALIGNMENTS.has(node.align)
    ? `wt-rich-align-${node.align}`
    : ''

const classAttr = (...names: Array<string | false | undefined>) => {
  const value = names.filter(Boolean).join(' ')
  return value ? ` class="${escapeAttribute(value)}"` : ''
}

/**
 * Block types that are nothing but a tag around their children. Editor names
 * and plain HTML names both map here, because bodies exist carrying either.
 */
const BLOCK_TAGS: Record<string, string> = {
  'block-quote': 'blockquote',
  'heading-one': 'h1',
  h1: 'h1',
  'heading-two': 'h2',
  h2: 'h2',
  'heading-three': 'h3',
  h3: 'h3',
  'bulleted-list': 'ul',
  ul: 'ul',
  'numbered-list': 'ol',
  ol: 'ol',
  'list-item': 'li',
  li: 'li',
}

const renderImageNode = (
  node: CmsRichTextNode,
  resolveAssetUrl: ResolveAssetUrl
) => {
  const rawSrc = typeof node.url === 'string' ? node.url : node.src
  const src = rawSrc ? resolveAssetUrl(rawSrc) : ''
  if (!src) return ''

  const align =
    node.align === 'left' || node.align === 'right' ? node.align : 'center'
  const classes = [
    'wt-rich-image',
    `wt-rich-image--align-${align}`,
    node.fullWidth ? 'wt-rich-image--full-width' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const alt = typeof node.alt === 'string' ? node.alt : ''
  const captionText =
    typeof node.caption === 'string' ? node.caption : getNodeText(node.children)
  const caption = captionText.trim()
    ? `<figcaption>${escapeHtml(captionText.trim())}</figcaption>`
    : ''

  return `<figure class="${classes}"><img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" loading="lazy" />${caption}</figure>`
}

const renderCell = (
  cell: CmsRichTextNode,
  resolveAssetUrl: ResolveAssetUrl
) => {
  const tag = cell.header ? 'th' : 'td'
  const scope = cell.header ? ' scope="col"' : ''
  return `<${tag}${scope}${classAttr(alignClass(cell))}>${renderChildren(cell.children, resolveAssetUrl)}</${tag}>`
}

const renderRow = (row: CmsRichTextNode, resolveAssetUrl: ResolveAssetUrl) => {
  // Anything that is not a cell is dropped rather than rendered in place: a
  // stray paragraph inside a `<tr>` is invalid markup the browser relocates,
  // which moves content out of the table entirely.
  const cells = (row.children ?? []).filter((cell) => cell.type === 'table-cell')
  if (!cells.length) return ''
  return `<tr>${cells.map((cell) => renderCell(cell, resolveAssetUrl)).join('')}</tr>`
}

/**
 * A table, wrapped in its own scroll container so a wide one scrolls within the
 * article column instead of widening the page on a phone.
 */
const renderTableNode = (
  node: CmsRichTextNode,
  resolveAssetUrl: ResolveAssetUrl
) => {
  const rows = (node.children ?? []).filter((row) => row.type === 'table-row')
  if (!rows.length) return ''

  const [first, ...rest] = rows
  const firstIsHeader =
    (first.children ?? []).length > 0 &&
    (first.children ?? []).every((cell) => cell.header === true)

  const head = firstIsHeader
    ? `<thead>${renderRow(first, resolveAssetUrl)}</thead>`
    : ''
  const bodyRows = firstIsHeader ? rest : rows
  const body = bodyRows
    .map((row) => renderRow(row, resolveAssetUrl))
    .join('')

  if (!head && !body) return ''

  return `<div class="wt-rich-table-wrap"><table class="wt-rich-table">${head}${body ? `<tbody>${body}</tbody>` : ''}</table></div>`
}

const renderNode = (
  node: CmsRichTextNode,
  resolveAssetUrl: ResolveAssetUrl
): string => {
  if (typeof node.text === 'string') {
    return renderTextNode(node)
  }

  if (node.type === 'image') return renderImageNode(node, resolveAssetUrl)
  if (node.type === 'table') return renderTableNode(node, resolveAssetUrl)

  if (node.type === 'paragraph') {
    return `<p${classAttr(
      isEmptyParagraph(node) && 'wt-rich-empty-paragraph',
      alignClass(node)
    )}>${renderChildren(node.children, resolveAssetUrl)}</p>`
  }

  // An unrecognised block still renders its text, as a paragraph. Losing the
  // wrapper is recoverable; losing the words is not.
  const tag = (node.type && BLOCK_TAGS[node.type]) || 'p'
  return `<${tag}${classAttr(alignClass(node))}>${renderChildren(node.children, resolveAssetUrl)}</${tag}>`
}

const parseCmsRichText = (body: string): CmsRichTextNode[] | null => {
  try {
    const parsed: unknown = JSON.parse(body)
    if (!Array.isArray(parsed) || !parsed.every(isRecord)) return null
    return parsed as CmsRichTextNode[]
  } catch {
    return null
  }
}

export const renderCmsBodyToHtml = (
  body: string | null | undefined,
  resolveAssetUrl: ResolveAssetUrl = (src) => src
): string => {
  const value = typeof body === 'string' ? body.trim() : ''
  if (!value) return ''

  const richText = parseCmsRichText(value)
  if (!richText) return body || ''

  return richText
    .map((node) => renderNode(node, resolveAssetUrl))
    .join('')
}
