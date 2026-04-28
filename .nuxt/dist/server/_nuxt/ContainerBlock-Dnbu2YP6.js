import { defineComponent, computed, createVNode, resolveDynamicComponent, unref, mergeProps, withCtx, openBlock, createBlock, createCommentVNode, Fragment, renderList, useSSRContext } from "vue";
import { ssrRenderVNode, ssrRenderStyle, ssrRenderClass, ssrRenderList, ssrRenderComponent } from "vue/server-renderer";
import { n as normalizeBlockType, g as getNodeChildren, a as getNodeClasses, b as getNodeStyles, c as getNodeDomId, E as ElementRenderer, d as getNodeKey } from "./default-yxUPDbdc.js";
import { h as hasBackgroundImage, g as getBackgroundPhotoSettings, s as stripPhotoStyles, p as pickBorderRadiusStyles, a as pickPhotoLayerStyles, t as toRgbaString } from "./backgroundPhoto-B9m0DFyg.js";
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
  __name: "ContainerBlock",
  __ssrInlineRender: true,
  props: {
    node: {}
  },
  setup(__props) {
    const props = __props;
    const nodeType = computed(() => normalizeBlockType(props.node?.type));
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
    const hasPhotoLayer = computed(() => hasBackgroundImage(nodeStyles.value));
    const photoSettings = computed(() => getBackgroundPhotoSettings(nodeStyles.value));
    const resolvedStyles = computed(() => {
      const base = hasPhotoLayer.value ? stripPhotoStyles(nodeStyles.value) : { ...nodeStyles.value };
      const fallbackMinHeight = isBodyRoot.value ? "40px" : isColumnLayout.value ? "180px" : isHeaderRoot.value || isFooterRoot.value || nodeType.value === "container" ? "10px" : void 0;
      const merged = {
        ...base,
        minHeight: isBodyRoot.value ? base.height || base.minHeight || fallbackMinHeight : base.minHeight || fallbackMinHeight,
        height: isBodyRoot.value ? "auto" : base.height || "auto"
      };
      if (hasPhotoLayer.value && !base.position) {
        merged.position = "relative";
      }
      return merged;
    });
    const photoLayerClipStyle = computed(
      () => pickBorderRadiusStyles(nodeStyles.value)
    );
    const photoLayerStyle = computed(
      () => pickPhotoLayerStyles(nodeStyles.value, photoSettings.value.photoOpacity)
    );
    const overlayStyle = computed(() => {
      if (photoSettings.value.overlayOpacity <= 0) return null;
      return {
        backgroundColor: toRgbaString(
          photoSettings.value.overlayColor,
          photoSettings.value.overlayOpacity
        )
      };
    });
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(tag)), mergeProps({
        class: ["wt-container-block", [
          unref(nodeClasses),
          {
            "wt-container-block--column-layout": unref(isColumnLayout) && !unref(hasPhotoLayer),
            "wt-container-block--two-col": unref(isTwoColumnLayout) && !unref(hasPhotoLayer),
            "wt-container-block--three-col": unref(isThreeColumnLayout) && !unref(hasPhotoLayer),
            "wt-container-block--body-root": unref(isBodyRoot),
            "wt-container-block--has-photo": unref(hasPhotoLayer)
          }
        ]],
        style: unref(resolvedStyles),
        "data-wt-node-id": unref(nodeDomId)
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(hasPhotoLayer)) {
              _push2(`<div class="wt-container-block__bg-layer" style="${ssrRenderStyle(unref(photoLayerClipStyle))}" aria-hidden="true" data-v-911f9253${_scopeId}><div class="wt-container-block__bg-photo" style="${ssrRenderStyle(unref(photoLayerStyle))}" data-v-911f9253${_scopeId}></div>`);
              if (unref(overlayStyle)) {
                _push2(`<div class="wt-container-block__bg-overlay" style="${ssrRenderStyle(unref(overlayStyle))}" data-v-911f9253${_scopeId}></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(hasPhotoLayer)) {
              _push2(`<div class="${ssrRenderClass([{
                "wt-container-block--column-layout": unref(isColumnLayout),
                "wt-container-block--two-col": unref(isTwoColumnLayout),
                "wt-container-block--three-col": unref(isThreeColumnLayout)
              }, "wt-container-block__content"])}" data-v-911f9253${_scopeId}><!--[-->`);
              ssrRenderList(unref(children), (child, index) => {
                _push2(ssrRenderComponent(ElementRenderer, {
                  key: unref(getNodeKey)(child, index),
                  node: child
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<!--[-->`);
              ssrRenderList(unref(children), (child, index) => {
                _push2(ssrRenderComponent(ElementRenderer, {
                  key: unref(getNodeKey)(child, index),
                  node: child
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]-->`);
            }
          } else {
            return [
              unref(hasPhotoLayer) ? (openBlock(), createBlock("div", {
                key: 0,
                class: "wt-container-block__bg-layer",
                style: unref(photoLayerClipStyle),
                "aria-hidden": "true"
              }, [
                createVNode("div", {
                  class: "wt-container-block__bg-photo",
                  style: unref(photoLayerStyle)
                }, null, 4),
                unref(overlayStyle) ? (openBlock(), createBlock("div", {
                  key: 0,
                  class: "wt-container-block__bg-overlay",
                  style: unref(overlayStyle)
                }, null, 4)) : createCommentVNode("", true)
              ], 4)) : createCommentVNode("", true),
              unref(hasPhotoLayer) ? (openBlock(), createBlock("div", {
                key: 1,
                class: ["wt-container-block__content", {
                  "wt-container-block--column-layout": unref(isColumnLayout),
                  "wt-container-block--two-col": unref(isTwoColumnLayout),
                  "wt-container-block--three-col": unref(isThreeColumnLayout)
                }]
              }, [
                (openBlock(true), createBlock(Fragment, null, renderList(unref(children), (child, index) => {
                  return openBlock(), createBlock(ElementRenderer, {
                    key: unref(getNodeKey)(child, index),
                    node: child
                  }, null, 8, ["node"]);
                }), 128))
              ], 2)) : (openBlock(true), createBlock(Fragment, { key: 2 }, renderList(unref(children), (child, index) => {
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
const ContainerBlock = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-911f9253"]]);
export {
  ContainerBlock as default
};
//# sourceMappingURL=ContainerBlock-Dnbu2YP6.js.map
