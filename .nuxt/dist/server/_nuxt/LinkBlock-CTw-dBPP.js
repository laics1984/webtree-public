import { e as __nuxt_component_0, _ as _export_sfc } from "../server.mjs";
import { defineComponent, computed, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderComponent, ssrInterpolate } from "vue/server-renderer";
import { e as getStringField, a as getNodeClasses, b as getNodeStyles, c as getNodeDomId } from "./default-yxUPDbdc.js";
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
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/perfect-debounce/dist/index.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/@unhead/vue/dist/index.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "LinkBlock",
  __ssrInlineRender: true,
  props: {
    node: {}
  },
  setup(__props) {
    const props = __props;
    const href = computed(() => getStringField(props.node, "href") || "#");
    const label = computed(() => getStringField(props.node, "label", "innerText", "text") || "Link");
    const nodeClasses = computed(() => getNodeClasses(props.node));
    const nodeStyles = computed(() => getNodeStyles(props.node));
    const nodeDomId = computed(() => getNodeDomId(props.node) || void 0);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(ssrRenderComponent(_component_NuxtLink, mergeProps({
        class: ["wt-link wt-ui-link", unref(nodeClasses)],
        style: unref(nodeStyles),
        "data-wt-node-id": unref(nodeDomId),
        to: unref(href)
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(label))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(label)), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/blocks/LinkBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const LinkBlock = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-9e48e78b"]]);
export {
  LinkBlock as default
};
//# sourceMappingURL=LinkBlock-CTw-dBPP.js.map
