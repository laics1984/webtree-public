globalThis.__timing__.logStart('Load chunks/build/SectionBlock-STHGqdEM');import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderList, ssrRenderComponent } from 'vue/server-renderer';
import { g as getNodeChildren, a as getNodeClasses, b as getNodeStyles, c as getNodeDomId, E as ElementRenderer, d as getNodeKey } from './default-yxUPDbdc.mjs';
import { h as hasBackgroundImage, g as getBackgroundPhotoSettings, s as stripPhotoStyles, p as pickBorderRadiusStyles, a as pickPhotoLayerStyles, t as toRgbaString } from './backgroundPhoto-B9m0DFyg.mjs';
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
  __name: "SectionBlock",
  __ssrInlineRender: true,
  props: {
    node: {}
  },
  setup(__props) {
    const props = __props;
    const children = computed(() => getNodeChildren(props.node));
    const nodeClasses = computed(() => getNodeClasses(props.node));
    const nodeStyles = computed(() => getNodeStyles(props.node));
    const nodeDomId = computed(() => getNodeDomId(props.node) || void 0);
    const hasPhotoLayer = computed(() => hasBackgroundImage(nodeStyles.value));
    const photoSettings = computed(() => getBackgroundPhotoSettings(nodeStyles.value));
    const resolvedStyles = computed(() => {
      const base = hasPhotoLayer.value ? stripPhotoStyles(nodeStyles.value) : { ...nodeStyles.value };
      const merged = { ...base };
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
      _push(`<section${ssrRenderAttrs(mergeProps({
        class: ["wt-section", [unref(nodeClasses), { "wt-section--has-photo": unref(hasPhotoLayer) }]],
        style: unref(resolvedStyles),
        "data-wt-node-id": unref(nodeDomId)
      }, _attrs))} data-v-98a1a0db>`);
      if (unref(hasPhotoLayer)) {
        _push(`<div class="wt-section__bg-layer" style="${ssrRenderStyle(unref(photoLayerClipStyle))}" aria-hidden="true" data-v-98a1a0db><div class="wt-section__bg-photo" style="${ssrRenderStyle(unref(photoLayerStyle))}" data-v-98a1a0db></div>`);
        if (unref(overlayStyle)) {
          _push(`<div class="wt-section__bg-overlay" style="${ssrRenderStyle(unref(overlayStyle))}" data-v-98a1a0db></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(hasPhotoLayer)) {
        _push(`<div class="wt-section__content" data-v-98a1a0db><!--[-->`);
        ssrRenderList(unref(children), (child, index) => {
          _push(ssrRenderComponent(ElementRenderer, {
            key: unref(getNodeKey)(child, index),
            node: child
          }, null, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!--[-->`);
        ssrRenderList(unref(children), (child, index) => {
          _push(ssrRenderComponent(ElementRenderer, {
            key: unref(getNodeKey)(child, index),
            node: child
          }, null, _parent));
        });
        _push(`<!--]-->`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/blocks/SectionBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const SectionBlock = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-98a1a0db"]]);

export { SectionBlock as default };;globalThis.__timing__.logEnd('Load chunks/build/SectionBlock-STHGqdEM');
//# sourceMappingURL=SectionBlock-STHGqdEM.mjs.map
