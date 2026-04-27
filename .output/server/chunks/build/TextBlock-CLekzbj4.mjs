import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs } from 'vue/server-renderer';
import { e as getStringField, a as getNodeClasses, b as getNodeStyles, c as getNodeDomId } from './PublicSitePage-C4ABRpXM.mjs';
import { _ as _export_sfc } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'perfect-debounce';
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
      var _a;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["wt-text", unref(nodeClasses)],
        style: unref(nodeStyles),
        "data-wt-node-id": unref(nodeDomId)
      }, _attrs))} data-v-6feba5c4>${(_a = unref(html)) != null ? _a : ""}</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/blocks/TextBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const TextBlock = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-6feba5c4"]]);

export { TextBlock as default };
//# sourceMappingURL=TextBlock-CLekzbj4.mjs.map
