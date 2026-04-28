import { hasInjectionContext, inject, defineComponent, defineAsyncComponent, computed, resolveComponent, unref, createVNode, resolveDynamicComponent, mergeProps, useSSRContext, withCtx, openBlock, createBlock, Fragment, renderList, createElementBlock, shallowRef, getCurrentInstance, provide, cloneVNode, h, toValue, onServerPrefetch, ref, nextTick, toRef, withAsyncContext } from "vue";
import { ssrRenderVNode, ssrRenderAttrs, ssrRenderList, ssrRenderComponent, ssrRenderClass, ssrRenderSlot } from "vue/server-renderer";
import { t as tryUseNuxtApp, _ as _export_sfc, u as useNuxtApp, a as useRuntimeConfig, b as asyncDataDefaults, c as createError, d as useRoute } from "../server.mjs";
import { removeResponseHeader, setResponseHeader, getResponseHeader } from "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/h3/dist/index.mjs";
import { debounce } from "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/perfect-debounce/dist/index.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/hookable/dist/index.mjs";
import "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/defu/dist/defu.mjs";
import { useHead as useHead$1, headSymbol } from "/Users/benjamin/Documents/Projects/webtree/webtree-public/node_modules/@unhead/vue/dist/index.mjs";
function injectHead(nuxtApp) {
  const nuxt = nuxtApp || tryUseNuxtApp();
  return nuxt?.ssrContext?.head || nuxt?.runWithContext(() => {
    if (hasInjectionContext()) {
      return inject(headSymbol);
    }
  });
}
function useHead(input, options = {}) {
  const head = injectHead(options.nuxt);
  if (head) {
    return useHead$1(input, { head, ...options });
  }
}
function isBlockNode(value) {
  return Boolean(value) && typeof value === "object";
}
function extractNodeChildren(value) {
  return Array.isArray(value) ? value.filter(isBlockNode) : [];
}
function getPropsRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const props = value.props;
  return props && typeof props === "object" && !Array.isArray(props) ? props : null;
}
function normalizeSchemaNodes(schema) {
  if (!schema) {
    return [];
  }
  if (Array.isArray(schema)) {
    return extractNodeChildren(schema);
  }
  if (Array.isArray(schema.elements)) {
    return extractNodeChildren(schema.elements);
  }
  if (Array.isArray(schema.children)) {
    return extractNodeChildren(schema.children);
  }
  const props = getPropsRecord(schema);
  if (Array.isArray(props?.elements)) {
    return extractNodeChildren(props.elements);
  }
  if (Array.isArray(props?.children)) {
    return extractNodeChildren(props.children);
  }
  if (Array.isArray(props?.content)) {
    return extractNodeChildren(props.content);
  }
  return [];
}
function getNodeChildren(node) {
  if (!node) {
    return [];
  }
  if (Array.isArray(node.children)) {
    return node.children.filter(isBlockNode);
  }
  if (Array.isArray(node.elements)) {
    return extractNodeChildren(node.elements);
  }
  if (Array.isArray(node.content)) {
    return extractNodeChildren(node.content);
  }
  const props = getPropsRecord(node);
  if (Array.isArray(props?.children)) {
    return extractNodeChildren(props.children);
  }
  if (Array.isArray(props?.elements)) {
    return extractNodeChildren(props.elements);
  }
  if (Array.isArray(props?.content)) {
    return extractNodeChildren(props.content);
  }
  return [];
}
function getNodeKey(node, index) {
  const key = node.id ?? node._key ?? node.type ?? "block";
  return `${String(key)}:${index}`;
}
function normalizeBlockType(type) {
  return (type || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  ...{ name: "ElementRenderer" },
  __name: "ElementRenderer",
  __ssrInlineRender: true,
  props: {
    node: {}
  },
  setup(__props) {
    const props = __props;
    const isDev = false;
    const registry = {
      header: defineAsyncComponent(() => import("./ContainerBlock-Dnbu2YP6.js")),
      body: defineAsyncComponent(() => import("./ContainerBlock-Dnbu2YP6.js")),
      footer: defineAsyncComponent(() => import("./ContainerBlock-Dnbu2YP6.js")),
      container: defineAsyncComponent(() => import("./ContainerBlock-Dnbu2YP6.js")),
      "2col": defineAsyncComponent(() => import("./ContainerBlock-Dnbu2YP6.js")),
      "3col": defineAsyncComponent(() => import("./ContainerBlock-Dnbu2YP6.js")),
      text: defineAsyncComponent(() => import("./TextBlock-zgyemoa2.js")),
      section: defineAsyncComponent(() => import("./SectionBlock-STHGqdEM.js")),
      image: defineAsyncComponent(() => import("./ImageBlock-x6d9d09i.js")),
      link: defineAsyncComponent(() => import("./LinkBlock-CTw-dBPP.js")),
      menu: defineAsyncComponent(() => import("./MenuBlock-DyaFmzDA.js")),
      hero: defineAsyncComponent(() => import("./HeroBlock-Bc2ljhR7.js")),
      contactform: defineAsyncComponent(() => import("./ContactFormBlock-xPlBKmRm.js"))
    };
    const component = computed(() => registry[normalizeBlockType(props.node?.type)]);
    const fallbackChildren = computed(() => getNodeChildren(props.node));
    const shouldRenderFallback = computed(() => fallbackChildren.value.length > 0);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ElementRenderer = resolveComponent("ElementRenderer", true);
      if (unref(component)) {
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(component)), mergeProps({ node: __props.node }, _attrs), null), _parent);
      } else if (unref(shouldRenderFallback)) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: "wt-unknown-block",
          "data-unsupported-block": "true"
        }, _attrs))} data-v-591f0679>`);
        if (unref(isDev)) {
          _push(`<p class="wt-unknown-label" data-v-591f0679> Unsupported content block </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(fallbackChildren), (child, index) => {
          _push(ssrRenderComponent(_component_ElementRenderer, {
            key: unref(getNodeKey)(child, index),
            node: child
          }, null, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/renderer/ElementRenderer.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const ElementRenderer = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-591f0679"]]);
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "SchemaRenderer",
  __ssrInlineRender: true,
  props: {
    schema: {},
    scope: {},
    as: { default: "div" }
  },
  setup(__props) {
    const props = __props;
    const nodes = computed(() => normalizeSchemaNodes(props.schema));
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(nodes).length) {
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(__props.as), mergeProps({
          class: "wt-schema-renderer",
          "data-scope": __props.scope
        }, _attrs), {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<!--[-->`);
              ssrRenderList(unref(nodes), (node, index) => {
                _push2(ssrRenderComponent(ElementRenderer, {
                  key: unref(getNodeKey)(node, index),
                  node
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]-->`);
            } else {
              return [
                (openBlock(true), createBlock(Fragment, null, renderList(unref(nodes), (node, index) => {
                  return openBlock(), createBlock(ElementRenderer, {
                    key: unref(getNodeKey)(node, index),
                    node
                  }, null, 8, ["node"]);
                }), 128))
              ];
            }
          }),
          _: 1
        }), _parent);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/renderer/SchemaRenderer.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const runtimeMenusKey = /* @__PURE__ */ Symbol("runtime-menus");
const runtimeHeaderSchemaKey = /* @__PURE__ */ Symbol("runtime-header-schema");
const runtimeHeaderOverlayKey = /* @__PURE__ */ Symbol("runtime-header-overlay");
function asRecord$1(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function isRuntimeStyleValue$1(value) {
  return typeof value === "string" || typeof value === "number";
}
function getNodeContent(node) {
  const record = asRecord$1(node);
  if (record?.content !== void 0) {
    return record.content;
  }
  return getNodePropsRecord(node)?.content;
}
function getNodeContentRecord(node) {
  return asRecord$1(getNodeContent(node));
}
function getNodePropsRecord(node) {
  return asRecord$1(asRecord$1(node)?.props);
}
function getNodeStyles(node) {
  const record = asRecord$1(node);
  const styles = asRecord$1(record?.styles ?? getNodePropsRecord(node)?.styles);
  if (!styles) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(styles).filter(([, value]) => isRuntimeStyleValue$1(value))
  );
}
function getNodeClasses(node) {
  const record = asRecord$1(node);
  const value = record?.classes ?? getNodePropsRecord(node)?.classes;
  return typeof value === "string" ? value.trim() : "";
}
function getNodeField(node, key) {
  const record = asRecord$1(node);
  if (record && record[key] !== void 0) {
    return record[key];
  }
  const props = getNodePropsRecord(node);
  if (props && props[key] !== void 0) {
    return props[key];
  }
  const content = getNodeContentRecord(node);
  return content ? content[key] : void 0;
}
function getStringField(node, ...keys) {
  for (const key of keys) {
    const value = getNodeField(node, key);
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}
function getBooleanField(node, ...keys) {
  for (const key of keys) {
    const value = getNodeField(node, key);
    if (typeof value === "boolean") {
      return value;
    }
  }
  return false;
}
function getArrayField(node, ...keys) {
  for (const key of keys) {
    const value = getNodeField(node, key);
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}
const MOBILE_BREAKPOINT_MAX = 767.98;
const TABLET_BREAKPOINT_MIN = 768;
const TABLET_BREAKPOINT_MAX = 1023.98;
const DEVICE_CANVAS_WIDTH = {
  Mobile: 375,
  Tablet: 768
};
const ROOT_TYPES = /* @__PURE__ */ new Set(["body", "header", "footer", "__body", "__header", "__footer"]);
const GENERATED_SECTION_SHELL_NAMES = /* @__PURE__ */ new Set([
  "Hero - Modern Split",
  "About - Story Split",
  "Features - Card Grid",
  "Services - Offer Grid",
  "Testimonials - Quote Grid",
  "CTA - Banner",
  "FAQ - Stacked",
  "Contact - Split Form"
]);
const GENERATED_GRID_NAMES = /* @__PURE__ */ new Set([
  "Hero Columns",
  "About Columns",
  "Feature Grid",
  "Services Grid",
  "Testimonial Grid",
  "Contact Columns"
]);
const GENERATED_CARD_MIN_HEIGHTS = {
  "Feature Card": "240px",
  "Service Card": "256px",
  "Testimonial Card": "248px"
};
const UNITLESS_PROPERTIES = /* @__PURE__ */ new Set([
  "animationIterationCount",
  "aspectRatio",
  "flex",
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "widows",
  "zIndex",
  "zoom"
]);
function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function isRuntimeStyleValue(value) {
  return typeof value === "string" || typeof value === "number";
}
function getResponsiveSource(node) {
  const record = asRecord(node);
  const props = asRecord(record?.props);
  return asRecord(record?.responsiveStyles ?? props?.responsiveStyles);
}
function getDeviceOverrideRecord(node, device) {
  const source = getResponsiveSource(node);
  return asRecord(device === "Mobile" ? source?.mobile : source?.tablet);
}
function getDeviceOverrides(node, device) {
  const source = getDeviceOverrideRecord(node, device);
  if (!source) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => isRuntimeStyleValue(value))
  );
}
function parsePixelValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string" || !value.includes("px")) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function hasOwnDefinedValue(record, property) {
  return Boolean(record && record[property] !== void 0);
}
function getNodeType(node) {
  return normalizeBlockType(getStringField(node, "type"));
}
function getNodeName(node) {
  return getStringField(node, "name") || "";
}
function getGeneratedLayoutStyleOverrides(node, device) {
  const nodeName = getNodeName(node);
  if (device === "Mobile") {
    return {};
  }
  if (GENERATED_SECTION_SHELL_NAMES.has(nodeName)) {
    return device === "Desktop" ? {
      gap: "72px"
    } : {
      gap: "28px"
    };
  }
  if (nodeName === "Section Intro") {
    return device === "Desktop" ? { gap: "24px" } : { gap: "10px" };
  }
  if (GENERATED_GRID_NAMES.has(nodeName)) {
    return device === "Desktop" ? { gap: "48px" } : { gap: "24px" };
  }
  if (nodeName === "About Highlights") {
    return device === "Desktop" ? { gap: "28px" } : { gap: "20px" };
  }
  if (nodeName === "FAQ Stack") {
    return device === "Desktop" ? { gap: "20px" } : { gap: "16px" };
  }
  if (nodeName === "About Highlight") {
    return device === "Desktop" ? {
      minHeight: "220px"
    } : {
      minHeight: "180px"
    };
  }
  const generatedCardMinHeight = GENERATED_CARD_MIN_HEIGHTS[nodeName];
  if (generatedCardMinHeight) {
    return device === "Desktop" ? {
      minHeight: generatedCardMinHeight
    } : {
      minHeight: nodeName === "Feature Card" ? "200px" : nodeName === "Service Card" ? "216px" : "208px"
    };
  }
  return {};
}
function getNodeVariant(node) {
  return (getStringField(node, "variant") || "").trim().toLowerCase();
}
function getNodeSlot(node) {
  return (getStringField(node, "slot") || "").trim().toLowerCase();
}
function getNodeIdValue(node) {
  const record = asRecord(node);
  const rawId = record?.id ?? record?._key;
  if (typeof rawId === "string" && rawId.trim()) {
    return rawId.trim();
  }
  if (typeof rawId === "number" && Number.isFinite(rawId)) {
    return String(rawId);
  }
  return null;
}
function toCssPropertyName(property) {
  if (property.startsWith("--")) {
    return property;
  }
  return property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
function toCssPropertyValue(property, value) {
  if (typeof value === "number") {
    return UNITLESS_PROPERTIES.has(property) ? String(value) : `${value}px`;
  }
  return value.replace(/[\r\n]+/g, " ").trim();
}
function escapeAttributeValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function buildCssRule(nodeId, styles) {
  const declarations = Object.entries(styles).filter(([, value]) => isRuntimeStyleValue(value)).map(([property, value]) => {
    const cssValue = toCssPropertyValue(property, value);
    return cssValue ? `${toCssPropertyName(property)}: ${cssValue} !important;` : "";
  }).filter(Boolean).join(" ");
  if (!declarations) {
    return null;
  }
  return `[data-wt-node-id="${escapeAttributeValue(nodeId)}"] { ${declarations} }`;
}
function shallowEqualStyles(a, b) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  return aKeys.every((key) => a[key] === b[key]);
}
function getNodeDomId(node) {
  return getNodeIdValue(node);
}
function getResponsiveNodeStyles(node, device, canvasWidth = DEVICE_CANVAS_WIDTH[device], context = {}) {
  const baseStyles = { ...getNodeStyles(node) };
  const colorMode = (getStringField(node, "colorMode") || "").trim().toLowerCase();
  if (getNodeType(node) === "menu" && colorMode === "auto") {
    delete baseStyles.color;
  }
  let mergedStyles = {
    ...baseStyles,
    ...getDeviceOverrides(node, device)
  };
  const deviceOverrideRecord = getDeviceOverrideRecord(node, device);
  const hasDeviceOverride = (property) => hasOwnDefinedValue(deviceOverrideRecord, property);
  const width = mergedStyles.width;
  const originalWidth = width;
  const widthPx = parsePixelValue(width);
  const leftPx = parsePixelValue(mergedStyles.left);
  const marginLeftPx = parsePixelValue(mergedStyles.marginLeft);
  const type = getNodeType(node);
  const isRootSection = ROOT_TYPES.has(type);
  const hasFixedPixelWidth = widthPx !== null;
  const isImageElement = type === "image";
  const isBrandLogoElement = isImageElement && /brand/i.test(getNodeName(node));
  const parentType = normalizeBlockType(context.parentType || "");
  const isHeaderImage = isImageElement && parentType === "header";
  const siblingTypes = context.siblingTypes || [];
  const scope = context.scope;
  const variant = getNodeVariant(node);
  const slot = getNodeSlot(node);
  const isHeaderRoot = type === "header";
  const isFooterRoot = type === "footer";
  const isHeaderMenu = type === "menu" && (parentType === "header" || variant.includes("header") || slot === "primary" || slot === "utility");
  const isFooterMenu = type === "menu" && (parentType === "footer" || variant.includes("footer") || slot === "legal" || slot === "footer" || slot === "social");
  const isHeaderLink = type === "link" && parentType === "header";
  const hasMenuSibling = siblingTypes.includes("menu");
  const hasImageSibling = siblingTypes.includes("image");
  const imageContent = getNodeContentRecord(node);
  const hasImageSource = isImageElement && typeof imageContent?.src === "string" && imageContent.src.trim().length > 0;
  if (isImageElement && !isBrandLogoElement && !isHeaderImage && !hasDeviceOverride("width")) {
    mergedStyles.width = "100%";
    if (!hasDeviceOverride("maxWidth")) mergedStyles.maxWidth = "100%";
    if (!hasDeviceOverride("left")) mergedStyles.left = "0";
    if (!hasDeviceOverride("marginLeft")) mergedStyles.marginLeft = "0";
    if (!hasDeviceOverride("right")) mergedStyles.right = "auto";
  }
  if (hasImageSource && !isBrandLogoElement && !isHeaderImage && !hasDeviceOverride("height")) {
    mergedStyles.height = "auto";
    if (!hasDeviceOverride("minHeight")) mergedStyles.minHeight = "0px";
  }
  if (hasFixedPixelWidth && !isRootSection && !isBrandLogoElement && !isHeaderImage) {
    mergedStyles.width = "100%";
    mergedStyles.maxWidth = "100%";
    mergedStyles.left = "0";
    mergedStyles.marginLeft = "0";
    mergedStyles.right = "auto";
  }
  if (typeof width === "string" && width.includes("px")) {
    const widthValue = Number.parseInt(width, 10);
    if (Number.isFinite(widthValue) && widthValue > canvasWidth && hasFixedPixelWidth && isRootSection) {
      mergedStyles.width = "100%";
      mergedStyles.maxWidth = width;
      if (mergedStyles.position === "absolute" || mergedStyles.position === "relative") {
        mergedStyles.left = "0";
        mergedStyles.marginLeft = "0";
        mergedStyles.right = "auto";
      }
    }
  }
  const couldOverflowFromOffsets = hasFixedPixelWidth && isRootSection && (leftPx !== null && leftPx + widthPx > canvasWidth || marginLeftPx !== null && marginLeftPx + widthPx > canvasWidth);
  if (couldOverflowFromOffsets) {
    mergedStyles.width = "100%";
    if (typeof originalWidth === "string" && originalWidth.includes("px")) {
      mergedStyles.maxWidth = originalWidth;
    }
    mergedStyles.left = "0";
    mergedStyles.marginLeft = "0";
    mergedStyles.right = "auto";
  }
  if (mergedStyles.position === "absolute" || mergedStyles.position === "relative") {
    const positionedLeft = parsePixelValue(mergedStyles.left);
    if (positionedLeft !== null && positionedLeft >= canvasWidth - 20) {
      mergedStyles.left = "0";
      mergedStyles.marginLeft = "0";
      mergedStyles.right = "auto";
    }
  }
  if (device === "Mobile" && typeof mergedStyles.fontSize === "string") {
    const fontSize = Number.parseInt(mergedStyles.fontSize, 10);
    if (Number.isFinite(fontSize) && fontSize > 16) {
      mergedStyles.fontSize = `${Math.max(14, fontSize * 0.875)}px`;
    }
  }
  if (device === "Mobile" && typeof mergedStyles.padding === "string") {
    const padding = Number.parseInt(mergedStyles.padding, 10);
    if (Number.isFinite(padding) && padding > 20) {
      mergedStyles.padding = `${Math.max(10, padding * 0.75)}px`;
    }
  }
  if (device === "Tablet" && typeof mergedStyles.fontSize === "string") {
    const fontSize = Number.parseInt(mergedStyles.fontSize, 10);
    if (Number.isFinite(fontSize) && fontSize > 20) {
      mergedStyles.fontSize = `${Math.max(16, fontSize * 0.9)}px`;
    }
  }
  mergedStyles = {
    ...mergedStyles,
    ...getGeneratedLayoutStyleOverrides(node, device)
  };
  if ((device === "Mobile" || device === "Tablet") && mergedStyles.display === "flex" && (scope === "header" || scope === "footer") && !hasDeviceOverride("flexWrap")) {
    mergedStyles.flexWrap = "wrap";
  }
  if (scope === "footer" && device === "Mobile" && mergedStyles.justifyContent === "space-between" && !hasDeviceOverride("justifyContent")) {
    mergedStyles.justifyContent = "flex-start";
  }
  if (device === "Tablet" && isHeaderRoot && (mergedStyles.display === "flex" || hasImageSibling && hasMenuSibling)) {
    if (!hasDeviceOverride("display")) mergedStyles.display = "flex";
    if (!hasDeviceOverride("flexWrap")) mergedStyles.flexWrap = "wrap";
  }
  if (device === "Tablet" && isHeaderMenu) {
    if (!hasDeviceOverride("width")) mergedStyles.width = "auto";
    if (!hasDeviceOverride("maxWidth")) mergedStyles.maxWidth = "100%";
    if (!hasDeviceOverride("flex")) mergedStyles.flex = "0 0 auto";
    if (!hasDeviceOverride("flexBasis")) mergedStyles.flexBasis = "auto";
    if (!hasDeviceOverride("marginLeft")) mergedStyles.marginLeft = "auto";
    if (!hasDeviceOverride("alignSelf")) mergedStyles.alignSelf = "center";
    if (!hasDeviceOverride("order")) mergedStyles.order = 99;
    if (!hasDeviceOverride("position")) mergedStyles.position = "static";
  }
  if (device === "Mobile" && isHeaderRoot && (mergedStyles.display === "flex" || hasImageSibling && hasMenuSibling)) {
    if (!hasDeviceOverride("display")) mergedStyles.display = "flex";
    if (!hasDeviceOverride("flexWrap")) mergedStyles.flexWrap = "wrap";
  }
  if (device === "Mobile" && isHeaderMenu) {
    if (!hasDeviceOverride("width")) mergedStyles.width = "auto";
    if (!hasDeviceOverride("maxWidth")) mergedStyles.maxWidth = "100%";
    if (!hasDeviceOverride("flex")) mergedStyles.flex = "0 0 auto";
    if (!hasDeviceOverride("flexBasis")) mergedStyles.flexBasis = "auto";
    if (!hasDeviceOverride("marginLeft")) mergedStyles.marginLeft = "auto";
    if (!hasDeviceOverride("alignSelf")) mergedStyles.alignSelf = "center";
    if (!hasDeviceOverride("order")) mergedStyles.order = 99;
    if (!hasDeviceOverride("position")) mergedStyles.position = "static";
  }
  if ((device === "Mobile" || device === "Tablet") && isHeaderImage) {
    if (!hasDeviceOverride("width")) mergedStyles.width = originalWidth ?? "auto";
    if (!hasDeviceOverride("maxWidth")) mergedStyles.maxWidth = "100%";
    if (!hasDeviceOverride("flex")) mergedStyles.flex = "0 0 auto";
    if (!hasDeviceOverride("marginLeft")) mergedStyles.marginLeft = "0";
    if (!hasDeviceOverride("marginRight")) mergedStyles.marginRight = "0";
    if (!hasDeviceOverride("alignSelf")) mergedStyles.alignSelf = "auto";
  }
  if (device === "Mobile" && isHeaderLink) {
    if (!hasDeviceOverride("display")) mergedStyles.display = "none";
  }
  if (device === "Tablet" && isHeaderLink) {
    if (!hasDeviceOverride("display")) mergedStyles.display = "none";
  }
  if (device === "Mobile" && isHeaderMenu && slot === "utility") {
    if (!hasDeviceOverride("display")) mergedStyles.display = "none";
  }
  if (device === "Tablet" && isHeaderMenu && slot === "utility") {
    if (!hasDeviceOverride("display")) mergedStyles.display = "none";
  }
  if (device === "Mobile" && isFooterMenu) {
    if (!hasDeviceOverride("width")) mergedStyles.width = "100%";
    if (!hasDeviceOverride("flexDirection")) mergedStyles.flexDirection = "column";
    if (!hasDeviceOverride("alignItems")) mergedStyles.alignItems = "flex-start";
    if (!hasDeviceOverride("gap")) mergedStyles.gap = "12px";
  }
  if (device === "Mobile" && isFooterRoot) {
    if (!hasDeviceOverride("padding") && typeof mergedStyles.padding === "string") {
      const padding = Number.parseInt(mergedStyles.padding, 10);
      if (Number.isFinite(padding) && padding > 24) {
        mergedStyles.padding = `${Math.max(16, padding * 0.75)}px`;
      }
    }
  }
  if (device === "Mobile" && isImageElement && parentType === "header" && !isBrandLogoElement && !hasDeviceOverride("maxWidth")) {
    mergedStyles.maxWidth = "100%";
  }
  return mergedStyles;
}
function visitSchemaNodes(schema, scope, visitor) {
  const queue = normalizeSchemaNodes(schema).map((node) => ({
    node,
    scope,
    parentType: "",
    siblingTypes: []
  }));
  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    visitor(current.node, {
      scope: current.scope,
      parentType: current.parentType,
      siblingTypes: current.siblingTypes
    });
    const children = getNodeChildren(current.node);
    const siblingTypes = children.map((child) => getNodeType(child)).filter(Boolean);
    queue.push(
      ...children.map((child) => ({
        node: child,
        scope: current.scope,
        parentType: getNodeType(current.node),
        siblingTypes
      }))
    );
  }
}
function buildResponsiveStylesheet(payload) {
  const desktopRules = [];
  const tabletRules = [];
  const mobileRules = [];
  for (const [scope, schema] of [
    ["header", payload.headerSchema],
    ["body", payload.bodySchema],
    ["footer", payload.footerSchema]
  ]) {
    visitSchemaNodes(schema, scope, (node, context) => {
      const nodeId = getNodeDomId(node);
      if (!nodeId) {
        return;
      }
      const baseStyles = getNodeStyles(node);
      const desktopStyles = {
        ...baseStyles,
        ...getGeneratedLayoutStyleOverrides(node, "Desktop")
      };
      const tabletStyles = getResponsiveNodeStyles(node, "Tablet", void 0, context);
      const mobileStyles = getResponsiveNodeStyles(node, "Mobile", void 0, context);
      if (!shallowEqualStyles(baseStyles, desktopStyles)) {
        const rule = buildCssRule(nodeId, desktopStyles);
        if (rule) {
          desktopRules.push(rule);
        }
      }
      if (!shallowEqualStyles(baseStyles, tabletStyles)) {
        const rule = buildCssRule(nodeId, tabletStyles);
        if (rule) {
          tabletRules.push(rule);
        }
      }
      if (!shallowEqualStyles(baseStyles, mobileStyles)) {
        const rule = buildCssRule(nodeId, mobileStyles);
        if (rule) {
          mobileRules.push(rule);
        }
      }
    });
  }
  const sections = [];
  if (desktopRules.length) {
    sections.push(
      `@media (min-width: 1024px) {
${desktopRules.join("\n")}
}`
    );
  }
  if (tabletRules.length) {
    sections.push(
      `@media (min-width: ${TABLET_BREAKPOINT_MIN}px) and (max-width: ${TABLET_BREAKPOINT_MAX}px) {
${tabletRules.join("\n")}
}`
    );
  }
  if (mobileRules.length) {
    sections.push(
      `@media (max-width: ${MOBILE_BREAKPOINT_MAX}px) {
${mobileRules.join("\n")}
}`
    );
  }
  return sections.join("\n\n");
}
const DEFAULT_CSS_VARS = {
  "--wt-color-primary": "#2563eb",
  "--wt-color-text": "#111827",
  "--wt-color-bg": "#ffffff",
  "--wt-color-muted": "#6b7280",
  "--wt-font-body": "Inter, Arial, sans-serif",
  "--wt-font-heading": "Inter, Arial, sans-serif"
};
function isStyleRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function toCssValue(value) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}
function toCssLength(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}px`;
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}
function normalizeTokenSegment(segment) {
  return segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}
function extractCssVars(source) {
  if (!isStyleRecord(source)) {
    return {};
  }
  const vars = {};
  for (const [key, value] of Object.entries(source)) {
    const cssValue = toCssValue(value);
    if (!key.startsWith("--") || cssValue === null) {
      continue;
    }
    vars[key] = cssValue;
  }
  return vars;
}
function flattenStyleTokens(source, prefix = "--wt", output = {}) {
  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith("--") || key === "cssVars" || key === "variables") {
      continue;
    }
    const tokenName = normalizeTokenSegment(key);
    if (!tokenName) {
      continue;
    }
    const cssValue = toCssValue(value);
    if (cssValue !== null) {
      output[`${prefix}-${tokenName}`] = cssValue;
      continue;
    }
    if (isStyleRecord(value)) {
      flattenStyleTokens(value, `${prefix}-${tokenName}`, output);
    }
  }
  return output;
}
function getNestedStyleValue(source, path) {
  let current = source;
  for (const segment of path) {
    if (!isStyleRecord(current)) {
      return null;
    }
    current = current[segment];
  }
  return toCssValue(current);
}
function buildCssVars(styles) {
  const directVars = {
    ...extractCssVars(styles),
    ...extractCssVars(isStyleRecord(styles?.cssVars) ? styles.cssVars : null),
    ...extractCssVars(isStyleRecord(styles?.variables) ? styles.variables : null)
  };
  const tokenVars = isStyleRecord(styles) ? flattenStyleTokens(styles) : {};
  const primaryColor = getNestedStyleValue(styles, ["colors", "primary"]) || directVars["--wt-color-primary"] || DEFAULT_CSS_VARS["--wt-color-primary"];
  const textColor = getNestedStyleValue(styles, ["colors", "text"]) || directVars["--wt-color-text"] || DEFAULT_CSS_VARS["--wt-color-text"];
  const backgroundColor = getNestedStyleValue(styles, ["colors", "background"]) || directVars["--wt-color-bg"] || DEFAULT_CSS_VARS["--wt-color-bg"];
  const surfaceColor = getNestedStyleValue(styles, ["colors", "surface"]) || directVars["--builder-color-surface"] || "#f8fafc";
  const secondaryColor = getNestedStyleValue(styles, ["colors", "secondary"]) || directVars["--builder-color-secondary"] || "#0f172a";
  const accentColor = getNestedStyleValue(styles, ["colors", "accent"]) || directVars["--builder-color-accent"] || "#f59e0b";
  const mutedColor = getNestedStyleValue(styles, ["colors", "muted"]) || directVars["--wt-color-muted"] || DEFAULT_CSS_VARS["--wt-color-muted"];
  const bodyFont = getNestedStyleValue(styles, ["fonts", "body"]) || getNestedStyleValue(styles, ["typography", "bodyFont"]) || directVars["--wt-font-body"] || DEFAULT_CSS_VARS["--wt-font-body"];
  const headingFont = getNestedStyleValue(styles, ["fonts", "heading"]) || getNestedStyleValue(styles, ["typography", "headingFont"]) || directVars["--wt-font-heading"] || bodyFont;
  const buttonBackground = getNestedStyleValue(styles, ["buttons", "background"]) || primaryColor;
  const buttonText = getNestedStyleValue(styles, ["buttons", "text"]) || "#ffffff";
  const buttonRadius = toCssLength(styles?.buttons && isStyleRecord(styles.buttons) ? styles.buttons.radius : null, "14px");
  const pageBackground = getNestedStyleValue(styles, ["page", "background"]) || backgroundColor;
  const pageMaxWidth = toCssLength(styles?.page && isStyleRecord(styles.page) ? styles.page.maxWidth : null, "1280px");
  return {
    ...DEFAULT_CSS_VARS,
    ...tokenVars,
    ...directVars,
    "--wt-color-primary": primaryColor,
    "--wt-color-text": textColor,
    "--wt-color-bg": backgroundColor,
    "--wt-color-muted": mutedColor,
    "--wt-font-body": bodyFont,
    "--wt-font-heading": headingFont,
    "--builder-color-primary": primaryColor,
    "--builder-color-secondary": secondaryColor,
    "--builder-color-accent": accentColor,
    "--builder-color-text": textColor,
    "--builder-color-background": backgroundColor,
    "--builder-color-surface": surfaceColor,
    "--builder-page-background": pageBackground,
    "--builder-page-max-width": pageMaxWidth,
    "--builder-font-body": bodyFont,
    "--builder-font-heading": headingFont,
    "--builder-button-background": buttonBackground,
    "--builder-button-text": buttonText,
    "--builder-button-radius": buttonRadius
  };
}
function useRequestEvent(nuxtApp) {
  nuxtApp ||= useNuxtApp();
  return nuxtApp.ssrContext?.event;
}
function useResponseHeader(header) {
  const event = useRequestEvent();
  return computed({
    get() {
      return getResponseHeader(event, header);
    },
    set(newValue) {
      if (!newValue) {
        return removeResponseHeader(event, header);
      }
      return setResponseHeader(event, header, newValue);
    }
  });
}
function readServerRequestHost() {
  const event = useRequestEvent();
  if (!event) {
    return "";
  }
  const forwardedHost = event.node.req.headers["x-forwarded-host"];
  const host = event.node.req.headers.host;
  return String(
    (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || (Array.isArray(host) ? host[0] : host) || ""
  );
}
function firstForwardedValue(value) {
  return (value || "").split(",")[0]?.trim() || "";
}
function stripOriginDecorators(value) {
  const candidate = value.trim();
  if (!candidate) {
    return "";
  }
  if (candidate.includes("://")) {
    try {
      return new URL(candidate).host;
    } catch {
      return "";
    }
  }
  return candidate.replace(/[/?#].*$/, "");
}
function parseHost(value) {
  const candidate = stripOriginDecorators(firstForwardedValue(value)).toLowerCase().replace(/^\.+|\.+$/g, "");
  if (!candidate) {
    return {
      host: "",
      hostname: "",
      port: ""
    };
  }
  if (candidate.startsWith("[")) {
    const closingBracket = candidate.indexOf("]");
    const hostname2 = closingBracket >= 0 ? candidate.slice(0, closingBracket + 1) : candidate;
    const remainder = closingBracket >= 0 ? candidate.slice(closingBracket + 1) : "";
    const port2 = remainder.startsWith(":") ? remainder.slice(1).replace(/[^\d].*$/, "") : "";
    return {
      host: port2 ? `${hostname2}:${port2}` : hostname2,
      hostname: hostname2,
      port: port2
    };
  }
  const portMatch = candidate.match(/^(.*?)(?::(\d+))?$/);
  const hostname = (portMatch?.[1] || candidate).replace(/^\.+|\.+$/g, "");
  const port = portMatch?.[2] || "";
  return {
    host: hostname ? port ? `${hostname}:${port}` : hostname : "",
    hostname,
    port
  };
}
function isLocalHostname(hostname) {
  return hostname === "localhost" || hostname.endsWith(".localhost");
}
function normalizeHost(value) {
  return parseHost(value).host;
}
function preferRequestHost(candidateHost, requestHost) {
  const candidate = parseHost(candidateHost);
  const request = parseHost(requestHost);
  if (!candidate.host) {
    return request.host;
  }
  if (!request.port) {
    return candidate.host;
  }
  if (!candidate.port && candidate.hostname === request.hostname) {
    return request.host;
  }
  return candidate.host;
}
function isLocalPlatformRequestHost(requestHost, platformBaseDomain) {
  const request = parseHost(requestHost);
  const platformBase = parseHost(platformBaseDomain);
  if (!request.hostname || !platformBase.hostname || !isLocalHostname(platformBase.hostname)) {
    return false;
  }
  if (platformBase.port && request.port && platformBase.port !== request.port) {
    return false;
  }
  const suffix = `.${platformBase.hostname}`;
  if (!request.hostname.endsWith(suffix)) {
    return false;
  }
  const prefix = request.hostname.slice(0, -suffix.length);
  return prefix.length > 0 && !prefix.includes(".");
}
function getRequestHost() {
  {
    return normalizeHost(readServerRequestHost());
  }
}
function mergeVaryHeader(existing, values) {
  const incoming = Array.isArray(values) ? values : [values];
  const merged = /* @__PURE__ */ new Map();
  for (const entry of [existing || "", ...incoming]) {
    for (const token of entry.split(",")) {
      const normalized = token.trim();
      if (!normalized) {
        continue;
      }
      merged.set(normalized.toLowerCase(), normalized);
    }
  }
  return Array.from(merged.values()).join(", ");
}
function resolveApiBase(apiBase) {
  const config = useRuntimeConfig();
  return `${config.publicApiBase || config.public.apiBase}/api/public`;
}
async function fetchPublicPage(host, path, apiBase) {
  const base = resolveApiBase();
  return await $fetch(`${base}/page`, {
    params: { host, path }
  });
}
async function fetchPublicSite(host, apiBase) {
  const base = resolveApiBase();
  return await $fetch(`${base}/site`, {
    params: { host }
  });
}
async function fetchPublicRoutes(host, apiBase) {
  const base = resolveApiBase();
  return await $fetch(`${base}/routes`, {
    params: { host }
  });
}
defineComponent({
  name: "ServerPlaceholder",
  render() {
    return createElementBlock("div");
  }
});
const clientOnlySymbol = /* @__PURE__ */ Symbol.for("nuxt:client-only");
defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  ...false,
  setup(props, { slots, attrs }) {
    const mounted = shallowRef(false);
    const vm = getCurrentInstance();
    if (vm) {
      vm._nuxtClientOnly = true;
    }
    provide(clientOnlySymbol, true);
    return () => {
      if (mounted.value) {
        const vnodes = slots.default?.();
        if (vnodes && vnodes.length === 1) {
          return [cloneVNode(vnodes[0], attrs)];
        }
        return vnodes;
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return h(slot);
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
const isDefer = (dedupe) => dedupe === "defer" || dedupe === false;
function useAsyncData(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (_isAutoKeyNeeded(args[0], args[1])) {
    args.unshift(autoKey);
  }
  let [_key, _handler, options = {}] = args;
  const key = computed(() => toValue(_key));
  if (typeof key.value !== "string") {
    throw new TypeError("[nuxt] [useAsyncData] key must be a string.");
  }
  if (typeof _handler !== "function") {
    throw new TypeError("[nuxt] [useAsyncData] handler must be a function.");
  }
  const nuxtApp = useNuxtApp();
  options.server ??= true;
  options.default ??= getDefault;
  options.getCachedData ??= getDefaultCachedData;
  options.lazy ??= false;
  options.immediate ??= true;
  options.deep ??= asyncDataDefaults.deep;
  options.dedupe ??= "cancel";
  options._functionName || "useAsyncData";
  nuxtApp._asyncData[key.value];
  function createInitialFetch() {
    const initialFetchOptions = { cause: "initial", dedupe: options.dedupe };
    if (!nuxtApp._asyncData[key.value]?._init) {
      initialFetchOptions.cachedData = options.getCachedData(key.value, nuxtApp, { cause: "initial" });
      nuxtApp._asyncData[key.value] = createAsyncData(nuxtApp, key.value, _handler, options, initialFetchOptions.cachedData);
    }
    return () => nuxtApp._asyncData[key.value].execute(initialFetchOptions);
  }
  const initialFetch = createInitialFetch();
  const asyncData = nuxtApp._asyncData[key.value];
  asyncData._deps++;
  const fetchOnServer = options.server !== false && nuxtApp.payload.serverRendered;
  if (fetchOnServer && options.immediate) {
    const promise = initialFetch();
    if (getCurrentInstance()) {
      onServerPrefetch(() => promise);
    } else {
      nuxtApp.hook("app:created", async () => {
        await promise;
      });
    }
  }
  const asyncReturn = {
    data: writableComputedRef(() => nuxtApp._asyncData[key.value]?.data),
    pending: writableComputedRef(() => nuxtApp._asyncData[key.value]?.pending),
    status: writableComputedRef(() => nuxtApp._asyncData[key.value]?.status),
    error: writableComputedRef(() => nuxtApp._asyncData[key.value]?.error),
    refresh: (...args2) => {
      if (!nuxtApp._asyncData[key.value]?._init) {
        const initialFetch2 = createInitialFetch();
        return initialFetch2();
      }
      return nuxtApp._asyncData[key.value].execute(...args2);
    },
    execute: (...args2) => asyncReturn.refresh(...args2),
    clear: () => {
      const entry = nuxtApp._asyncData[key.value];
      if (entry?._abortController) {
        try {
          entry._abortController.abort(new DOMException("AsyncData aborted by user.", "AbortError"));
        } finally {
          entry._abortController = void 0;
        }
      }
      clearNuxtDataByKey(nuxtApp, key.value);
    }
  };
  const asyncDataPromise = Promise.resolve(nuxtApp._asyncDataPromises[key.value]).then(() => asyncReturn);
  Object.assign(asyncDataPromise, asyncReturn);
  Object.defineProperties(asyncDataPromise, {
    then: { enumerable: true, value: asyncDataPromise.then.bind(asyncDataPromise) },
    catch: { enumerable: true, value: asyncDataPromise.catch.bind(asyncDataPromise) },
    finally: { enumerable: true, value: asyncDataPromise.finally.bind(asyncDataPromise) }
  });
  return asyncDataPromise;
}
function writableComputedRef(getter) {
  return computed({
    get() {
      return getter()?.value;
    },
    set(value) {
      const ref2 = getter();
      if (ref2) {
        ref2.value = value;
      }
    }
  });
}
function _isAutoKeyNeeded(keyOrFetcher, fetcher) {
  if (typeof keyOrFetcher === "string") {
    return false;
  }
  if (typeof keyOrFetcher === "object" && keyOrFetcher !== null) {
    return false;
  }
  if (typeof keyOrFetcher === "function" && typeof fetcher === "function") {
    return false;
  }
  return true;
}
function clearNuxtDataByKey(nuxtApp, key) {
  if (key in nuxtApp.payload.data) {
    nuxtApp.payload.data[key] = void 0;
  }
  if (key in nuxtApp.payload._errors) {
    nuxtApp.payload._errors[key] = asyncDataDefaults.errorValue;
  }
  if (nuxtApp._asyncData[key]) {
    nuxtApp._asyncData[key].data.value = void 0;
    nuxtApp._asyncData[key].error.value = asyncDataDefaults.errorValue;
    {
      nuxtApp._asyncData[key].pending.value = false;
    }
    nuxtApp._asyncData[key].status.value = "idle";
  }
  if (key in nuxtApp._asyncDataPromises) {
    nuxtApp._asyncDataPromises[key] = void 0;
  }
}
function pick(obj, keys) {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
}
function createAsyncData(nuxtApp, key, _handler, options, initialCachedData) {
  nuxtApp.payload._errors[key] ??= asyncDataDefaults.errorValue;
  const hasCustomGetCachedData = options.getCachedData !== getDefaultCachedData;
  const handler = !import.meta.prerender || !nuxtApp.ssrContext?.["~sharedPrerenderCache"] ? _handler : (nuxtApp2, options2) => {
    const value = nuxtApp2.ssrContext["~sharedPrerenderCache"].get(key);
    if (value) {
      return value;
    }
    const promise = Promise.resolve().then(() => nuxtApp2.runWithContext(() => _handler(nuxtApp2, options2)));
    nuxtApp2.ssrContext["~sharedPrerenderCache"].set(key, promise);
    return promise;
  };
  const _ref = options.deep ? ref : shallowRef;
  const hasCachedData = initialCachedData != null;
  const unsubRefreshAsyncData = nuxtApp.hook("app:data:refresh", async (keys) => {
    if (!keys || keys.includes(key)) {
      await asyncData.execute({ cause: "refresh:hook" });
    }
  });
  const asyncData = {
    data: _ref(hasCachedData ? initialCachedData : options.default()),
    pending: shallowRef(!hasCachedData),
    error: toRef(nuxtApp.payload._errors, key),
    status: shallowRef("idle"),
    execute: (...args) => {
      const [_opts, newValue = void 0] = args;
      const opts = _opts && newValue === void 0 && typeof _opts === "object" ? _opts : {};
      if (nuxtApp._asyncDataPromises[key]) {
        if (isDefer(opts.dedupe ?? options.dedupe)) {
          return nuxtApp._asyncDataPromises[key];
        }
      }
      if (opts.cause === "initial" || nuxtApp.isHydrating) {
        const cachedData = "cachedData" in opts ? opts.cachedData : options.getCachedData(key, nuxtApp, { cause: opts.cause ?? "refresh:manual" });
        if (cachedData != null) {
          nuxtApp.payload.data[key] = asyncData.data.value = cachedData;
          asyncData.error.value = asyncDataDefaults.errorValue;
          asyncData.status.value = "success";
          return Promise.resolve(cachedData);
        }
      }
      {
        asyncData.pending.value = true;
      }
      if (asyncData._abortController) {
        asyncData._abortController.abort(new DOMException("AsyncData request cancelled by deduplication", "AbortError"));
      }
      asyncData._abortController = new AbortController();
      asyncData.status.value = "pending";
      const cleanupController = new AbortController();
      const promise = new Promise(
        (resolve, reject) => {
          try {
            const timeout = opts.timeout ?? options.timeout;
            const mergedSignal = mergeAbortSignals([asyncData._abortController?.signal, opts?.signal], cleanupController.signal, timeout);
            if (mergedSignal.aborted) {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
              return;
            }
            mergedSignal.addEventListener("abort", () => {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
            }, { once: true, signal: cleanupController.signal });
            return Promise.resolve(handler(nuxtApp, { signal: mergedSignal })).then(resolve, reject);
          } catch (err) {
            reject(err);
          }
        }
      ).then(async (_result) => {
        let result = _result;
        if (options.transform) {
          result = await options.transform(_result);
        }
        if (options.pick) {
          result = pick(result, options.pick);
        }
        nuxtApp.payload.data[key] = result;
        asyncData.data.value = result;
        asyncData.error.value = asyncDataDefaults.errorValue;
        asyncData.status.value = "success";
      }).catch((error) => {
        if (nuxtApp._asyncDataPromises[key] && nuxtApp._asyncDataPromises[key] !== promise) {
          return nuxtApp._asyncDataPromises[key];
        }
        if (asyncData._abortController?.signal.aborted) {
          return nuxtApp._asyncDataPromises[key];
        }
        if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
          asyncData.status.value = "idle";
          return nuxtApp._asyncDataPromises[key];
        }
        asyncData.error.value = createError(error);
        asyncData.data.value = unref(options.default());
        asyncData.status.value = "error";
      }).finally(() => {
        {
          asyncData.pending.value = false;
        }
        cleanupController.abort();
        delete nuxtApp._asyncDataPromises[key];
      });
      nuxtApp._asyncDataPromises[key] = promise;
      return nuxtApp._asyncDataPromises[key];
    },
    _execute: debounce((...args) => asyncData.execute(...args), 0, { leading: true }),
    _default: options.default,
    _deps: 0,
    _init: true,
    _hash: void 0,
    _off: () => {
      unsubRefreshAsyncData();
      if (nuxtApp._asyncData[key]?._init) {
        nuxtApp._asyncData[key]._init = false;
      }
      if (!hasCustomGetCachedData) {
        nextTick(() => {
          if (!nuxtApp._asyncData[key]?._init) {
            clearNuxtDataByKey(nuxtApp, key);
            asyncData.execute = () => Promise.resolve();
            asyncData.data.value = asyncDataDefaults.value;
          }
        });
      }
    }
  };
  return asyncData;
}
const getDefault = () => asyncDataDefaults.value;
const getDefaultCachedData = (key, nuxtApp, ctx) => {
  if (nuxtApp.isHydrating) {
    return nuxtApp.payload.data[key];
  }
  if (ctx.cause !== "refresh:manual" && ctx.cause !== "refresh:hook") {
    return nuxtApp.static.data[key];
  }
};
function mergeAbortSignals(signals, cleanupSignal, timeout) {
  const list = signals.filter((s) => !!s);
  if (typeof timeout === "number" && timeout >= 0) {
    const timeoutSignal = AbortSignal.timeout?.(timeout);
    if (timeoutSignal) {
      list.push(timeoutSignal);
    }
  }
  if (AbortSignal.any) {
    return AbortSignal.any(list);
  }
  const controller = new AbortController();
  for (const sig of list) {
    if (sig.aborted) {
      const reason = sig.reason ?? new DOMException("Aborted", "AbortError");
      try {
        controller.abort(reason);
      } catch {
        controller.abort();
      }
      return controller.signal;
    }
  }
  const onAbort = () => {
    const abortedSignal = list.find((s) => s.aborted);
    const reason = abortedSignal?.reason ?? new DOMException("Aborted", "AbortError");
    try {
      controller.abort(reason);
    } catch {
      controller.abort();
    }
  };
  for (const sig of list) {
    sig.addEventListener?.("abort", onAbort, { once: true, signal: cleanupSignal });
  }
  return controller.signal;
}
function getStatusCode(error) {
  if (!error || typeof error !== "object") {
    return 500;
  }
  const statusCode = "statusCode" in error ? Number(error.statusCode) : NaN;
  if (!Number.isNaN(statusCode) && statusCode > 0) {
    return statusCode;
  }
  if ("data" in error && error.data && typeof error.data === "object" && "statusCode" in error.data) {
    const nestedStatusCode = Number(error.data.statusCode);
    if (!Number.isNaN(nestedStatusCode) && nestedStatusCode > 0) {
      return nestedStatusCode;
    }
  }
  return 500;
}
function getErrorMessage(error) {
  if (!error || typeof error !== "object") {
    return null;
  }
  if ("statusMessage" in error && typeof error.statusMessage === "string" && error.statusMessage.trim()) {
    return error.statusMessage;
  }
  if ("message" in error && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  if ("data" in error && error.data && typeof error.data === "object") {
    if ("message" in error.data && typeof error.data.message === "string" && error.data.message.trim()) {
      return error.data.message;
    }
    if ("statusMessage" in error.data && typeof error.data.statusMessage === "string" && error.data.statusMessage.trim()) {
      return error.data.statusMessage;
    }
  }
  return null;
}
function resolvePageError(error, host, apiBase) {
  const statusCode = getStatusCode(error);
  getErrorMessage(error);
  if (statusCode === 404) {
    return createError({ statusCode: 404, statusMessage: "Page not found" });
  }
  return createError({ statusCode: 502, statusMessage: "Unable to load this site page right now." });
}
function normalizePublicPath(path) {
  if (typeof path !== "string") {
    return null;
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return "/";
  }
  const pathname = trimmed.split(/[?#]/)[0] || "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
function resolveHomepageFallbackPath(data) {
  const routes = Array.isArray(data?.routes) ? data.routes : [];
  const explicitHomepage = routes.find((route) => route.isHomepage || normalizePublicPath(route.path) === "/");
  if (explicitHomepage) {
    return normalizePublicPath(explicitHomepage.path);
  }
  const fallbackSegments = [data?.siteKey, data?.publicIdentifier].filter(
    (value) => typeof value === "string" && value.trim().length > 0
  );
  if (!fallbackSegments.length) {
    return null;
  }
  const fallbackPaths = new Set(fallbackSegments.map((segment) => `/${segment.trim()}`));
  for (const route of routes) {
    const routePath = normalizePublicPath(route.path);
    if (routePath && fallbackPaths.has(routePath)) {
      return routePath;
    }
    const slug = typeof route.slug === "string" ? route.slug.trim() : "";
    if (slug && fallbackSegments.includes(slug)) {
      return routePath;
    }
  }
  return null;
}
function getNestedNodeCount(node) {
  if (!node || typeof node !== "object") {
    return 0;
  }
  const candidate = node;
  return candidate.content?.length || candidate.children?.length || candidate.elements?.length || 0;
}
function getSchemaChildCount(schema) {
  if (!schema) {
    return 0;
  }
  if (Array.isArray(schema)) {
    return schema.reduce((count, node) => count + getNestedNodeCount(node), 0);
  }
  if (Array.isArray(schema.elements)) {
    return schema.elements.reduce((count, node) => count + getNestedNodeCount(node), 0);
  }
  if (Array.isArray(schema.children)) {
    return schema.children.reduce((count, node) => count + getNestedNodeCount(node), 0);
  }
  return getNestedNodeCount(schema);
}
function siteShellLooksEmpty(site) {
  const headerCount = getSchemaChildCount(site?.headerSchema);
  const footerCount = getSchemaChildCount(site?.footerSchema);
  return headerCount === 0 || footerCount === 0;
}
async function withFreshSiteShell(payload, host) {
  if (!siteShellLooksEmpty(payload.site)) {
    return payload;
  }
  try {
    const siteResponse = await fetchPublicSite(host);
    if (!siteShellLooksEmpty(siteResponse.site)) {
      return {
        ...payload,
        site: siteResponse.site
      };
    }
  } catch {
    return payload;
  }
  return payload;
}
async function fetchResolvedPublicPage(host, path) {
  try {
    const payload = await fetchPublicPage(host, path);
    return await withFreshSiteShell(payload, host);
  } catch (error) {
    if (path !== "/" || getStatusCode(error) !== 404) {
      throw error;
    }
    let fallbackPath = null;
    try {
      const routes = await fetchPublicRoutes(host);
      fallbackPath = resolveHomepageFallbackPath(routes);
    } catch {
      fallbackPath = null;
    }
    if (!fallbackPath || fallbackPath === path) {
      throw error;
    }
    try {
      const payload = await fetchPublicPage(host, fallbackPath);
      return await withFreshSiteShell(payload, host);
    } catch (fallbackError) {
      if (getStatusCode(fallbackError) === 404) {
        throw error;
      }
      throw fallbackError;
    }
  }
}
async function usePublicPage() {
  const route = useRoute();
  const config = useRuntimeConfig();
  const host = getRequestHost();
  const path = computed(() => normalizePublicPath(route.path) || "/");
  const { data, error } = await useAsyncData(
    `public-page:${host}`,
    () => fetchResolvedPublicPage(host, path.value),
    {
      watch: [path],
      default: () => null
    }
  );
  if (error.value) {
    throw resolvePageError(error.value, host, config.public.apiBase);
  }
  if (!data.value?.entity || !data.value?.site || !data.value?.page) {
    throw createError({ statusCode: 404, statusMessage: "Page not found" });
  }
  return data;
}
function normalizeSiteProtocol(value) {
  return value === "http" ? "http" : "https";
}
function resolvePublicHost(source, requestHost, platformBaseDomain) {
  const normalizedRequestHost = normalizeHost(requestHost);
  if (isLocalPlatformRequestHost(normalizedRequestHost, platformBaseDomain)) {
    return normalizedRequestHost;
  }
  const preferredHost = normalizeHost(source?.canonicalHost || source?.resolvedHost || normalizedRequestHost) || normalizedRequestHost;
  return preferRequestHost(preferredHost, normalizedRequestHost);
}
function isJsonObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function buildTitle(title, suffix) {
  if (!suffix || !title) {
    return title;
  }
  if (title.endsWith(suffix)) {
    return title;
  }
  const separator = /^\s|^[|:-]/.test(suffix) ? "" : " ";
  return `${title}${separator}${suffix}`;
}
function normalizePath(path) {
  if (!path) {
    return "/";
  }
  return path.startsWith("/") ? path : `/${path}`;
}
function toAbsoluteUrl(value, baseUrl) {
  if (!value) {
    return null;
  }
  try {
    return new URL(value, baseUrl || void 0).toString();
  } catch {
    return null;
  }
}
function buildRobots(seo, fallback) {
  const directives = new Set(
    (seo?.robots || fallback).split(",").map((directive) => directive.trim()).filter(Boolean)
  );
  if (seo?.noindex) {
    directives.delete("index");
    directives.delete("follow");
    directives.add("noindex");
    directives.add("nofollow");
  }
  if (seo?.noarchive) {
    directives.add("noarchive");
  }
  return Array.from(directives).join(", ") || fallback;
}
function normalizeStructuredData(value) {
  if (!value) {
    return [];
  }
  if (typeof value === "string") {
    try {
      return normalizeStructuredData(JSON.parse(value));
    } catch {
      return [];
    }
  }
  const items = Array.isArray(value) ? value : [value];
  return items.flatMap((item) => {
    if (!isJsonObject(item)) {
      return [];
    }
    try {
      return [JSON.stringify(item)];
    } catch {
      return [];
    }
  });
}
function usePublicSeo(payload) {
  const config = useRuntimeConfig();
  const requestHost = getRequestHost();
  const siteProtocol = normalizeSiteProtocol(config.public.siteProtocol);
  useHead(() => {
    const entity = payload.value?.entity;
    const site = payload.value?.site;
    const page = payload.value?.page;
    const seo = page?.seo;
    const siteName = site?.defaults?.siteName || entity?.siteKey || "Website";
    const publicHost = resolvePublicHost(entity, requestHost, config.public.platformBaseDomain);
    const baseUrl = publicHost ? toAbsoluteUrl(`${siteProtocol}://${publicHost}`) : null;
    const fallbackTitle = page?.title || siteName;
    const title = buildTitle(seo?.title || fallbackTitle, site?.defaults?.titleSuffix);
    const description = seo?.description || page?.description || site?.defaults?.defaultDescription || "";
    const canonical = toAbsoluteUrl(seo?.canonicalUrl || normalizePath(page?.path), baseUrl);
    const robots = buildRobots(seo, site?.defaults?.robotsDefault || "index,follow");
    const ogImage = toAbsoluteUrl(seo?.ogImage || site?.defaults?.defaultOgImage, baseUrl);
    const twitterImage = toAbsoluteUrl(seo?.twitterImage || ogImage, baseUrl);
    const favicon = toAbsoluteUrl(entity?.favicon, baseUrl);
    const structuredData = normalizeStructuredData(seo?.structuredData || site?.defaults?.structuredDataJsonLd);
    const link = [];
    const meta = [];
    if (description) {
      meta.push({ name: "description", content: description });
    }
    meta.push({ name: "robots", content: robots });
    meta.push({ property: "og:title", content: seo?.ogTitle || title });
    meta.push({ property: "og:description", content: seo?.ogDescription || description });
    meta.push({ property: "og:type", content: seo?.ogType || "website" });
    {
      meta.push({ property: "og:site_name", content: siteName });
    }
    if (canonical) {
      meta.push({ property: "og:url", content: canonical });
    }
    meta.push({ name: "twitter:card", content: seo?.twitterCard || site?.defaults?.defaultTwitterCard || "summary_large_image" });
    meta.push({ name: "twitter:title", content: seo?.twitterTitle || title });
    meta.push({ name: "twitter:description", content: seo?.twitterDescription || description });
    if (ogImage) {
      meta.push({ property: "og:image", content: ogImage });
    }
    if (twitterImage) {
      meta.push({ name: "twitter:image", content: twitterImage });
    }
    if (seo?.articlePublishedTime) {
      meta.push({ property: "article:published_time", content: seo.articlePublishedTime });
    }
    if (seo?.articleModifiedTime) {
      meta.push({ property: "article:modified_time", content: seo.articleModifiedTime });
    }
    if (canonical) {
      link.push({ rel: "canonical", href: canonical });
    }
    if (favicon) {
      link.push({ rel: "icon", href: favicon });
    }
    return {
      title,
      htmlAttrs: {
        lang: entity?.defaultLocale || "en"
      },
      link,
      meta,
      script: structuredData.map((item, index) => ({
        key: `json-ld:${index}`,
        type: "application/ld+json",
        children: item
      }))
    };
  });
}
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "PublicSitePage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const payload = ([__temp, __restore] = withAsyncContext(() => usePublicPage()), __temp = await __temp, __restore(), __temp);
    usePublicSeo(payload);
    const cssVars = computed(() => buildCssVars(payload.value?.site?.builderStyles));
    const runtimeMenus = computed(() => payload.value?.site?.menus ?? []);
    const pageWidthMode = computed(() => {
      const styles = payload.value?.site?.builderStyles;
      const page = styles && typeof styles === "object" && !Array.isArray(styles) ? styles.page : null;
      if (!page || typeof page !== "object" || Array.isArray(page)) {
        return "contained";
      }
      return page.widthMode === "full" ? "full" : "contained";
    });
    const runtimeHeaderSchema = computed(() => payload.value?.site?.headerSchema);
    const runtimeHeaderOverlay = computed(() => {
      const headerSchema = payload.value?.site?.headerSchema;
      if (!headerSchema || typeof headerSchema !== "object" || Array.isArray(headerSchema)) {
        return false;
      }
      const behavior = "behavior" in headerSchema ? headerSchema.behavior : null;
      return Boolean(
        behavior && typeof behavior === "object" && !Array.isArray(behavior) && "overlay" in behavior && behavior.overlay === true
      );
    });
    const runtimeHeaderPosition = computed(() => {
      const headerSchema = payload.value?.site?.headerSchema;
      if (!headerSchema || typeof headerSchema !== "object" || Array.isArray(headerSchema)) {
        return "static";
      }
      const behavior = "behavior" in headerSchema ? headerSchema.behavior : null;
      if (behavior && typeof behavior === "object" && !Array.isArray(behavior) && "position" in behavior && behavior.position === "sticky") {
        return "sticky";
      }
      return "static";
    });
    const responsiveCss = computed(
      () => buildResponsiveStylesheet({
        headerSchema: payload.value?.site?.headerSchema,
        bodySchema: payload.value?.page?.bodySchema,
        footerSchema: payload.value?.site?.footerSchema
      })
    );
    provide(runtimeMenusKey, runtimeMenus);
    provide(runtimeHeaderSchemaKey, runtimeHeaderSchema);
    provide(runtimeHeaderOverlayKey, runtimeHeaderOverlay);
    useHead(() => ({
      style: responsiveCss.value ? [{
        key: "wt-responsive-runtime",
        textContent: responsiveCss.value
      }] : []
    }));
    {
      const vary = useResponseHeader("vary");
      vary.value = mergeVaryHeader(vary.value, ["Host", "X-Forwarded-Host"]);
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "wt-site",
        style: unref(cssVars),
        "data-site-key": unref(payload)?.entity?.siteKey || "",
        "data-page-width-mode": unref(pageWidthMode)
      }, _attrs))}>`);
      if (unref(payload)?.site?.headerSchema) {
        _push(`<header class="${ssrRenderClass([{
          "wt-page-header--sticky": unref(runtimeHeaderPosition) === "sticky" && !unref(runtimeHeaderOverlay),
          "wt-page-header--overlay": unref(runtimeHeaderOverlay)
        }, "wt-page-header"])}">`);
        _push(ssrRenderComponent(_sfc_main$2, {
          schema: unref(payload)?.site?.headerSchema,
          scope: "header"
        }, null, _parent));
        _push(`</header>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<main class="wt-main">`);
      _push(ssrRenderComponent(_sfc_main$2, {
        schema: unref(payload)?.page?.bodySchema,
        scope: "body"
      }, null, _parent));
      _push(`</main>`);
      if (unref(payload)?.site?.footerSchema) {
        _push(`<footer class="wt-page-footer">`);
        _push(ssrRenderComponent(_sfc_main$2, {
          schema: unref(payload)?.site?.footerSchema,
          scope: "footer"
        }, null, _parent));
        _push(`</footer>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/public/PublicSitePage.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_sfc_main$1, null, null, _parent));
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main
}, Symbol.toStringTag, { value: "Module" }));
export {
  ElementRenderer as E,
  _default as _,
  getNodeClasses as a,
  getNodeStyles as b,
  getNodeDomId as c,
  getNodeKey as d,
  getStringField as e,
  getBooleanField as f,
  getNodeChildren as g,
  runtimeHeaderSchemaKey as h,
  runtimeHeaderOverlayKey as i,
  normalizeSchemaNodes as j,
  getArrayField as k,
  getNodeField as l,
  getNodeContentRecord as m,
  normalizeBlockType as n,
  runtimeMenusKey as r
};
//# sourceMappingURL=default-yxUPDbdc.js.map
