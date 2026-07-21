import type { InjectionKey } from 'vue'
import type { PublicListingContext } from '~/types/public'

export const currentListingKey: InjectionKey<PublicListingContext | null> =
  Symbol('currentListing')
