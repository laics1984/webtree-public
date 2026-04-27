import { defineComponent, computed, unref, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr } from 'vue/server-renderer';
import { e as getStringField, f as getBooleanField, a as getNodeClasses, b as getNodeStyles, c as getNodeDomId } from './PublicSitePage-C4ABRpXM.mjs';
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
  __name: "ImageBlock",
  __ssrInlineRender: true,
  props: {
    node: {}
  },
  setup(__props) {
    const props = __props;
    const src = computed(() => getStringField(props.node, "src", "imageUrl"));
    const alt = computed(() => getStringField(props.node, "alt", "title") || "");
    const isHero = computed(() => getBooleanField(props.node, "priority") || getStringField(props.node, "fetchpriority") === "high");
    const nodeClasses = computed(() => getNodeClasses(props.node));
    const nodeStyles = computed(() => getNodeStyles(props.node));
    const nodeDomId = computed(() => getNodeDomId(props.node) || void 0);
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(src)) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: ["wt-image-block", unref(nodeClasses)],
          style: unref(nodeStyles),
          "data-wt-node-id": unref(nodeDomId)
        }, _attrs))} data-v-d481ddc0><img class="wt-image"${ssrRenderAttr("src", unref(src))}${ssrRenderAttr("alt", unref(alt))}${ssrRenderAttr("loading", unref(isHero) ? "eager" : "lazy")}${ssrRenderAttr("fetchpriority", unref(isHero) ? "high" : "auto")} data-v-d481ddc0></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/blocks/ImageBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ImageBlock = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-d481ddc0"]]);

export { ImageBlock as default };
//# sourceMappingURL=ImageBlock-lHKvt8xn.mjs.map
