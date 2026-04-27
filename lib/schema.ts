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

export function getNodeKey(node: PublicBlockNode, index: number): string {
  const key = node.id ?? node._key ?? node.type ?? 'block'
  return `${String(key)}:${index}`
}

export function normalizeBlockType(type?: string | null): string {
  return (type || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}
