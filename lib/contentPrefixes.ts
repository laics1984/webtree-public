import type { InjectionKey } from 'vue'

export interface ContentPrefixes {
  article: string
  event: string
}

// Provided by the catch-all dispatcher so deep template blocks (e.g. taxonomy
// links in DynamicFieldBlock) can build URLs that honour the site's permalink
// prefixes instead of hardcoding `/articles`.
export const contentPrefixesKey: InjectionKey<ContentPrefixes | null> =
  Symbol('webtree:contentPrefixes')
