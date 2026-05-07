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

const renderChildren = (
  children: CmsRichTextNode[] | undefined,
  resolveAssetUrl: ResolveAssetUrl
) => {
  const html = Array.isArray(children)
    ? children.map((child) => renderNode(child, resolveAssetUrl)).join('')
    : ''

  return html || '<br />'
}

const isEmptyParagraph = (node: CmsRichTextNode) =>
  node.type === 'paragraph' &&
  (!Array.isArray(node.children) ||
    node.children.every((child) => getNodeText([child]).trim() === ''))

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

const renderNode = (
  node: CmsRichTextNode,
  resolveAssetUrl: ResolveAssetUrl
): string => {
  if (typeof node.text === 'string') {
    return renderTextNode(node)
  }

  switch (node.type) {
    case 'image':
      return renderImageNode(node, resolveAssetUrl)
    case 'block-quote':
      return `<blockquote>${renderChildren(node.children, resolveAssetUrl)}</blockquote>`
    case 'heading-one':
    case 'h1':
      return `<h1>${renderChildren(node.children, resolveAssetUrl)}</h1>`
    case 'heading-two':
    case 'h2':
      return `<h2>${renderChildren(node.children, resolveAssetUrl)}</h2>`
    case 'heading-three':
    case 'h3':
      return `<h3>${renderChildren(node.children, resolveAssetUrl)}</h3>`
    case 'bulleted-list':
    case 'ul':
      return `<ul>${renderChildren(node.children, resolveAssetUrl)}</ul>`
    case 'numbered-list':
    case 'ol':
      return `<ol>${renderChildren(node.children, resolveAssetUrl)}</ol>`
    case 'list-item':
    case 'li':
      return `<li>${renderChildren(node.children, resolveAssetUrl)}</li>`
    case 'paragraph': {
      const className = isEmptyParagraph(node)
        ? ' class="wt-rich-empty-paragraph"'
        : ''
      return `<p${className}>${renderChildren(node.children, resolveAssetUrl)}</p>`
    }
    default:
      return `<p>${renderChildren(node.children, resolveAssetUrl)}</p>`
  }
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
