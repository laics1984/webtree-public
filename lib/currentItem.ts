import type { InjectionKey } from 'vue'
import type { PublicContentItem } from '~/types/public'

export const currentItemKey: InjectionKey<PublicContentItem | null> =
  Symbol('webtree:currentItem')
