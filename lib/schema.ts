import type { PublicBlockNode, PublicSchemaTree } from '~/types/public'

type SchemaInput = PublicSchemaTree | PublicBlockNode[] | null | undefined

function isBlockNode(value: unknown): value is PublicBlockNode {
  return Boolean(value) && typeof value === 'object'
}

function extractNodeChildren(value: unknown): PublicBlockNode[] {
  return Array.isArray(value) ? value.filter(isBlockNode) : []
}

function getPropsRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const props = (value as Record<string, unknown>).props
  return props && typeof props === 'object' && !Array.isArray(props)
    ? props as Record<string, unknown>
    : null
}

export function normalizeSchemaNodes(schema?: SchemaInput): PublicBlockNode[] {
  if (!schema) {
    return []
  }

  if (Array.isArray(schema)) {
    return extractNodeChildren(schema)
  }

  if (Array.isArray(schema.elements)) {
    return extractNodeChildren(schema.elements)
  }

  if (Array.isArray(schema.children)) {
    return extractNodeChildren(schema.children)
  }

  const props = getPropsRecord(schema)

  if (Array.isArray(props?.elements)) {
    return extractNodeChildren(props.elements)
  }

  if (Array.isArray(props?.children)) {
    return extractNodeChildren(props.children)
  }

  if (Array.isArray(props?.content)) {
    return extractNodeChildren(props.content)
  }

  return []
}

export function getNodeChildren(node?: PublicBlockNode | null): PublicBlockNode[] {
  if (!node) {
    return []
  }

  if (Array.isArray(node.children)) {
    return node.children.filter(isBlockNode)
  }

  if (Array.isArray(node.elements)) {
    return extractNodeChildren(node.elements)
  }

  if (Array.isArray(node.content)) {
    return extractNodeChildren(node.content)
  }

  const props = getPropsRecord(node)

  if (Array.isArray(props?.children)) {
    return extractNodeChildren(props.children)
  }

  if (Array.isArray(props?.elements)) {
    return extractNodeChildren(props.elements)
  }

  if (Array.isArray(props?.content)) {
    return extractNodeChildren(props.content)
  }

  return []
}

// The write side of `getNodeChildren`: puts children back under the same key
// they were read from, so a payload that nests them under `props` does not end
// up with two child lists and the runtime reading the untouched one.
export function withNodeChildren(
  node: PublicBlockNode,
  children: PublicBlockNode[]
): PublicBlockNode {
  if (Array.isArray(node.children)) return { ...node, children }
  if (Array.isArray(node.elements)) return { ...node, elements: children }
  if (Array.isArray(node.content)) return { ...node, content: children }

  const props = getPropsRecord(node)
  for (const key of ['children', 'elements', 'content'] as const) {
    if (Array.isArray(props?.[key])) {
      return { ...node, props: { ...props, [key]: children } }
    }
  }

  return node
}

export function getNodeKey(node: PublicBlockNode, index: number): string {
  const key = node.id ?? node._key ?? node.type ?? 'block'
  return `${String(key)}:${index}`
}

export function getNodeName(node: PublicBlockNode | Record<string, unknown> | null | undefined): string {
  const name = (node as Record<string, unknown> | null | undefined)?.name
  return typeof name === 'string' ? name : ''
}

// Mirror of builder/src/lib/hero-typography.ts's `isHeroSectionName` — section
// names vary ("Hero", "Hero - Background", "Hero Columns", ...), so match the
// "Hero" prefix rather than an exact name.
export function isHeroSectionName(name: string): boolean {
  return /^hero\b/i.test(name.trim())
}

// Sub-pages prepend a leading 'Breadcrumb' section ahead of the page's first
// real section. Shared by PublicSiteShell's hero-layout detection and
// SchemaRenderer's overlay-header spacer so both agree on which node is
// "first" for their respective purposes.
export function findFirstNonBreadcrumbNode(
  nodes: PublicBlockNode[]
): { node: PublicBlockNode; index: number } | null {
  const index = nodes.findIndex((node) => getNodeName(node) !== 'Breadcrumb')
  return index === -1 ? null : { node: nodes[index], index }
}

export function normalizeBlockType(type?: string | null): string {
  return (type || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

// The stored/served body schema wraps a page's sections in a single `__body`
// root node (see the renderer's ROOT_TYPES). Section-level detection — first
// hero, header-overlay marker, hero-layout sniff — must inspect the sections
// INSIDE that wrapper, not the wrapper itself (which carries none of those
// fields). This peels one body-root level; a schema that is already a flat
// section list (older sites, or a header/footer schema) is returned unchanged,
// so it is safe to route every body-section lookup through it.
export function isBodyRootNode(node?: PublicBlockNode | null): boolean {
  if (!node) return false
  const type = normalizeBlockType((node as Record<string, unknown>).type as string | undefined)
  return type === 'body' || getNodeName(node) === 'Body'
}

export function normalizeBodySectionNodes(schema?: SchemaInput): PublicBlockNode[] {
  const nodes = normalizeSchemaNodes(schema)
  if (nodes.length === 1 && isBodyRootNode(nodes[0])) {
    const inner = getNodeChildren(nodes[0])
    if (inner.length > 0) {
      return inner
    }
  }
  return nodes
}
