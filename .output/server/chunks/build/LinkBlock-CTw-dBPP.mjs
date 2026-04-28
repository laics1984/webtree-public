globalThis.__timing__.logStart('Load chunks/build/LinkBlock-CTw-dBPP');import { _ as _export_sfc, e as __nuxt_component_0 } from './server.mjs';
import { defineComponent, computed, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { e as getStringField, a as getNodeClasses, b as getNodeStyles, c as getNodeDomId } from './default-yxUPDbdc.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';
import '@fortawesome/fontawesome-svg-core';
import '@fortawesome/free-solid-svg-icons';
import '@fortawesome/vue-fontawesome';
import 'perfect-debounce';

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

export { LinkBlock as default };;globalThis.__timing__.logEnd('Load chunks/build/LinkBlock-CTw-dBPP');
//# sourceMappingURL=LinkBlock-CTw-dBPP.mjs.map
