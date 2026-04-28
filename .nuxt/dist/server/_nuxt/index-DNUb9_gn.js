import { useSSRContext } from "vue";
import { _ as _export_sfc } from "../server.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/hookable/dist/index.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/unctx/dist/index.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/defu/dist/defu.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/ufo/dist/index.mjs";
import "@fortawesome/fontawesome-svg-core";
import "@fortawesome/free-solid-svg-icons";
import "@fortawesome/vue-fontawesome";
import "vue/server-renderer";
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  index as default
};
//# sourceMappingURL=index-DNUb9_gn.js.map
