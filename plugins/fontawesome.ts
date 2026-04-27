import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowRight,
  faBars,
  faChevronDown,
  faEnvelope,
  faGlobe,
  faImage,
  faPhone,
  faXmark
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faArrowRight,
  faBars,
  faChevronDown,
  faEnvelope,
  faGlobe,
  faImage,
  faPhone,
  faXmark
)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon)
})
