import { defineComponent, computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs } from "vue/server-renderer";
import { e as getStringField, a as getNodeClasses, b as getNodeStyles, c as getNodeDomId } from "./default-yxUPDbdc.js";
import { _ as _export_sfc } from "../server.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/h3/dist/index.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/perfect-debounce/dist/index.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/hookable/dist/index.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/defu/dist/defu.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/@unhead/vue/dist/index.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/unctx/dist/index.mjs";
import "vue-router";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/ufo/dist/index.mjs";
import "@fortawesome/fontawesome-svg-core";
import "@fortawesome/free-solid-svg-icons";
import "@fortawesome/vue-fontawesome";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "TextBlock",
  __ssrInlineRender: true,
  props: {
    node: {}
  },
  setup(__props) {
    const props = __props;
    const html = computed(() => getStringField(props.node, "html", "innerText", "text") || "");
    const nodeClasses = computed(() => getNodeClasses(props.node));
    const nodeStyles = computed(() => getNodeStyles(props.node));
    const nodeDomId = computed(() => getNodeDomId(props.node) || void 0);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["wt-text", unref(nodeClasses)],
        style: unref(nodeStyles),
        "data-wt-node-id": unref(nodeDomId)
      }, _attrs))} data-v-bbf12bfb>${unref(html) ?? ""}</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/blocks/TextBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const TextBlock = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-bbf12bfb"]]);
export {
  TextBlock as default
};
//# sourceMappingURL=TextBlock-zgyemoa2.js.map
