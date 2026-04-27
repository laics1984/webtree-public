import { defineComponent, computed, createVNode, resolveDynamicComponent, unref, mergeProps, withCtx, openBlock, createBlock, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderVNode, ssrRenderList, ssrRenderComponent } from 'vue/server-renderer';
import { n as normalizeBlockType, g as getNodeChildren, a as getNodeClasses, b as getNodeStyles, c as getNodeDomId, E as ElementRenderer, d as getNodeKey } from './PublicSitePage-C4ABRpXM.mjs';
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
  __name: "ContainerBlock",
  __ssrInlineRender: true,
  props: {
    node: {}
  },
  setup(__props) {
    const props = __props;
    const nodeType = computed(() => {
      var _a;
      return normalizeBlockType((_a = props.node) == null ? void 0 : _a.type);
    });
    const children = computed(() => getNodeChildren(props.node));
    const nodeClasses = computed(() => getNodeClasses(props.node));
    const nodeStyles = computed(() => getNodeStyles(props.node));
    const nodeDomId = computed(() => getNodeDomId(props.node) || void 0);
    const tag = computed(() => nodeType.value === "section" ? "section" : "div");
    const isTwoColumnLayout = computed(() => nodeType.value === "2col");
    const isThreeColumnLayout = computed(() => nodeType.value === "3col");
    const isColumnLayout = computed(() => isTwoColumnLayout.value || isThreeColumnLayout.value);
    const isBodyRoot = computed(() => nodeType.value === "body");
    const isHeaderRoot = computed(() => nodeType.value === "header");
    const isFooterRoot = computed(() => nodeType.value === "footer");
    const resolvedStyles = computed(() => {
      const styles = { ...nodeStyles.value };
      const fallbackMinHeight = isBodyRoot.value ? "40px" : isColumnLayout.value ? "180px" : isHeaderRoot.value || isFooterRoot.value || nodeType.value === "container" ? "10px" : void 0;
      return {
        ...styles,
        minHeight: isBodyRoot.value ? styles.height || styles.minHeight || fallbackMinHeight : styles.minHeight || fallbackMinHeight,
        height: isBodyRoot.value ? "auto" : styles.height || "auto"
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(tag)), mergeProps({
        class: ["wt-container-block", [
          unref(nodeClasses),
          {
            "wt-container-block--column-layout": unref(isColumnLayout),
            "wt-container-block--two-col": unref(isTwoColumnLayout),
            "wt-container-block--three-col": unref(isThreeColumnLayout),
            "wt-container-block--body-root": unref(isBodyRoot)
          }
        ]],
        style: unref(resolvedStyles),
        "data-wt-node-id": unref(nodeDomId)
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<!--[-->`);
            ssrRenderList(unref(children), (child, index) => {
              _push2(ssrRenderComponent(ElementRenderer, {
                key: unref(getNodeKey)(child, index),
                node: child
              }, null, _parent2, _scopeId));
            });
            _push2(`<!--]-->`);
          } else {
            return [
              (openBlock(true), createBlock(Fragment, null, renderList(unref(children), (child, index) => {
                return openBlock(), createBlock(ElementRenderer, {
                  key: unref(getNodeKey)(child, index),
                  node: child
                }, null, 8, ["node"]);
              }), 128))
            ];
          }
        }),
        _: 1
      }), _parent);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/blocks/ContainerBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ContainerBlock = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-92691f8f"]]);

export { ContainerBlock as default };
//# sourceMappingURL=ContainerBlock-0VhEf2io.mjs.map
