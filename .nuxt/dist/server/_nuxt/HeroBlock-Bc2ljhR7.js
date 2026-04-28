import { defineComponent, computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr } from "vue/server-renderer";
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
  __name: "HeroBlock",
  __ssrInlineRender: true,
  props: {
    node: {}
  },
  setup(__props) {
    const props = __props;
    const eyebrow = computed(() => getStringField(props.node, "eyebrow"));
    const title = computed(() => getStringField(props.node, "title"));
    const description = computed(() => getStringField(props.node, "description"));
    const image = computed(() => getStringField(props.node, "image", "imageUrl", "src"));
    const nodeClasses = computed(() => getNodeClasses(props.node));
    const nodeStyles = computed(() => getNodeStyles(props.node));
    const nodeDomId = computed(() => getNodeDomId(props.node) || void 0);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        class: ["wt-hero", unref(nodeClasses)],
        style: unref(nodeStyles),
        "data-wt-node-id": unref(nodeDomId)
      }, _attrs))} data-v-8bd59fe5>`);
      if (unref(eyebrow)) {
        _push(`<p class="wt-eyebrow wt-ui-pill" data-v-8bd59fe5>${ssrInterpolate(unref(eyebrow))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<h1 class="wt-title wt-ui-heading" data-v-8bd59fe5>${ssrInterpolate(unref(title))}</h1>`);
      if (unref(description)) {
        _push(`<p class="wt-description wt-ui-muted" data-v-8bd59fe5>${ssrInterpolate(unref(description))}</p>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(image)) {
        _push(`<img class="wt-hero-image"${ssrRenderAttr("src", unref(image))}${ssrRenderAttr("alt", unref(title) || "")} loading="eager" fetchpriority="high" data-v-8bd59fe5>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/blocks/HeroBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const HeroBlock = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-8bd59fe5"]]);
export {
  HeroBlock as default
};
//# sourceMappingURL=HeroBlock-Bc2ljhR7.js.map
