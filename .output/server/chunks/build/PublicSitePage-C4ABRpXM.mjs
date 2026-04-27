import { defineComponent, withAsyncContext, computed, provide, mergeProps, unref, createVNode, resolveDynamicComponent, withCtx, openBlock, createBlock, Fragment, renderList, toValue, getCurrentInstance, onServerPrefetch, hasInjectionContext, inject, defineAsyncComponent, resolveComponent, ref, shallowRef, nextTick, toRef, useSSRContext, createElementBlock, cloneVNode, h } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderComponent, ssrRenderVNode, ssrRenderList } from 'vue/server-renderer';
import { d as useRoute, c as createError, a as useRuntimeConfig, u as useNuxtApp, b as asyncDataDefaults, t as tryUseNuxtApp, _ as _export_sfc } from './server.mjs';
import { B as removeResponseHeader, C as setResponseHeader, D as getResponseHeader } from '../nitro/nitro.mjs';
import { debounce } from 'perfect-debounce';
import { u as useHead$1, h as headSymbol } from '../routes/renderer.mjs';

function injectHead(nuxtApp) {
  var _a;
  const nuxt = nuxtApp || tryUseNuxtApp();
  return ((_a = nuxt == null ? void 0 : nuxt.ssrContext) == null ? void 0 : _a.head) || (nuxt == null ? void 0 : nuxt.runWithContext(() => {
    if (hasInjectionContext()) {
      return inject(headSymbol);
    }
  }));
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
  if (Array.isArray(props == null ? void 0 : props.elements)) {
    return extractNodeChildren(props.elements);
  }
  if (Array.isArray(props == null ? void 0 : props.children)) {
    return extractNodeChildren(props.children);
  }
  if (Array.isArray(props == null ? void 0 : props.content)) {
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
  if (Array.isArray(props == null ? void 0 : props.children)) {
    return extractNodeChildren(props.children);
  }
  if (Array.isArray(props == null ? void 0 : props.elements)) {
    return extractNodeChildren(props.elements);
  }
  if (Array.isArray(props == null ? void 0 : props.content)) {
    return extractNodeChildren(props.content);
  }
  return [];
}
function getNodeKey(node, index) {
  var _a, _b, _c;
  const key = (_c = (_b = (_a = node.id) != null ? _a : node._key) != null ? _b : node.type) != null ? _c : "block";
  return `${String(key)}:${index}`;
}
function normalizeBlockType(type) {
  return (type || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
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
      header: defineAsyncComponent(() => import('./ContainerBlock-0VhEf2io.mjs')),
      body: defineAsyncComponent(() => import('./ContainerBlock-0VhEf2io.mjs')),
      footer: defineAsyncComponent(() => import('./ContainerBlock-0VhEf2io.mjs')),
      container: defineAsyncComponent(() => import('./ContainerBlock-0VhEf2io.mjs')),
      "2col": defineAsyncComponent(() => import('./ContainerBlock-0VhEf2io.mjs')),
      "3col": defineAsyncComponent(() => import('./ContainerBlock-0VhEf2io.mjs')),
      text: defineAsyncComponent(() => import('./TextBlock-CLekzbj4.mjs')),
      section: defineAsyncComponent(() => import('./SectionBlock-CfkBBWTp.mjs')),
      image: defineAsyncComponent(() => import('./ImageBlock-lHKvt8xn.mjs')),
      link: defineAsyncComponent(() => import('./LinkBlock-BkX9Ft4U.mjs')),
      menu: defineAsyncComponent(() => import('./MenuBlock-Day3jbCZ.mjs')),
      hero: defineAsyncComponent(() => import('./HeroBlock-BVBXiB2J.mjs')),
      contactform: defineAsyncComponent(() => import('./ContactFormBlock-BcsK828a.mjs'))
    };
    const component = computed(() => {
      var _a;
      return registry[normalizeBlockType((_a = props.node) == null ? void 0 : _a.type)];
    });
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
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/renderer/ElementRenderer.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const ElementRenderer = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-591f0679"]]);
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
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
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/renderer/SchemaRenderer.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
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
  var _a;
  const record = asRecord$1(node);
  if ((record == null ? void 0 : record.content) !== void 0) {
    return record.content;
  }
  return (_a = getNodePropsRecord(node)) == null ? void 0 : _a.content;
}
function getNodeContentRecord(node) {
  return asRecord$1(getNodeContent(node));
}
function getNodePropsRecord(node) {
  var _a;
  return asRecord$1((_a = asRecord$1(node)) == null ? void 0 : _a.props);
}
function getNodeStyles(node) {
  var _a, _b;
  const record = asRecord$1(node);
  const styles = asRecord$1((_b = record == null ? void 0 : record.styles) != null ? _b : (_a = getNodePropsRecord(node)) == null ? void 0 : _a.styles);
  if (!styles) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(styles).filter(([, value]) => isRuntimeStyleValue$1(value))
  );
}
function getNodeClasses(node) {
  var _a, _b;
  const record = asRecord$1(node);
  const value = (_b = record == null ? void 0 : record.classes) != null ? _b : (_a = getNodePropsRecord(node)) == null ? void 0 : _a.classes;
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
  var _a;
  const record = asRecord(node);
  const props = asRecord(record == null ? void 0 : record.props);
  return asRecord((_a = record == null ? void 0 : record.responsiveStyles) != null ? _a : props == null ? void 0 : props.responsiveStyles);
}
function getDeviceOverrideRecord(node, device) {
  const source = getResponsiveSource(node);
  return asRecord(device === "Mobile" ? source == null ? void 0 : source.mobile : source == null ? void 0 : source.tablet);
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
function withExplicitPadding(paddingTop, paddingRight, paddingBottom, paddingLeft) {
  return {
    padding: `${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft}`,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft
  };
}
function getGeneratedLayoutStyleOverrides(node, device) {
  const nodeName = getNodeName(node);
  if (device === "Mobile") {
    return {};
  }
  if (GENERATED_SECTION_SHELL_NAMES.has(nodeName)) {
    return device === "Desktop" ? {
      ...withExplicitPadding("160px", "96px", "160px", "96px"),
      gap: "72px"
    } : {
      ...withExplicitPadding("72px", "32px", "72px", "32px"),
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
  if (nodeName === "CTA Banner") {
    return device === "Desktop" ? withExplicitPadding("56px", "48px", "56px", "48px") : withExplicitPadding("36px", "28px", "36px", "28px");
  }
  if (nodeName === "About Highlight") {
    return device === "Desktop" ? {
      ...withExplicitPadding("48px", "44px", "48px", "44px"),
      minHeight: "220px"
    } : {
      ...withExplicitPadding("24px", "24px", "24px", "24px"),
      minHeight: "180px"
    };
  }
  const generatedCardMinHeight = GENERATED_CARD_MIN_HEIGHTS[nodeName];
  if (generatedCardMinHeight) {
    return device === "Desktop" ? {
      ...withExplicitPadding("48px", "44px", "48px", "44px"),
      minHeight: generatedCardMinHeight
    } : {
      ...withExplicitPadding("24px", "24px", "24px", "24px"),
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
  var _a;
  const record = asRecord(node);
  const rawId = (_a = record == null ? void 0 : record.id) != null ? _a : record == null ? void 0 : record._key;
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
  const hasImageSource = isImageElement && typeof (imageContent == null ? void 0 : imageContent.src) === "string" && imageContent.src.trim().length > 0;
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
    if (!hasDeviceOverride("width")) mergedStyles.width = originalWidth != null ? originalWidth : "auto";
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
    ...extractCssVars(isStyleRecord(styles == null ? void 0 : styles.cssVars) ? styles.cssVars : null),
    ...extractCssVars(isStyleRecord(styles == null ? void 0 : styles.variables) ? styles.variables : null)
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
  const buttonRadius = toCssLength((styles == null ? void 0 : styles.buttons) && isStyleRecord(styles.buttons) ? styles.buttons.radius : null, "14px");
  const pageBackground = getNestedStyleValue(styles, ["page", "background"]) || backgroundColor;
  const pageMaxWidth = toCssLength((styles == null ? void 0 : styles.page) && isStyleRecord(styles.page) ? styles.page.maxWidth : null, "1280px");
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
  var _a;
  nuxtApp || (nuxtApp = useNuxtApp());
  return (_a = nuxtApp.ssrContext) == null ? void 0 : _a.event;
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
  var _a;
  return ((_a = (value || "").split(",")[0]) == null ? void 0 : _a.trim()) || "";
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
  const hostname = ((portMatch == null ? void 0 : portMatch[1]) || candidate).replace(/^\.+|\.+$/g, "");
  const port = (portMatch == null ? void 0 : portMatch[2]) || "";
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
  if (apiBase) {
    return apiBase;
  }
  return useRuntimeConfig().public.apiBase;
}
async function fetchPublicPage(host, path, apiBase) {
  return await $fetch(`${resolveApiBase(apiBase)}/api/public/page`, {
    params: { host, path }
  });
}
async function fetchPublicSite(host, apiBase) {
  return await $fetch(`${resolveApiBase(apiBase)}/api/public/site`, {
    params: { host }
  });
}
async function fetchPublicRoutes(host, apiBase) {
  return await $fetch(`${resolveApiBase(apiBase)}/api/public/routes`, {
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
      var _a;
      if (mounted.value) {
        const vnodes = (_a = slots.default) == null ? void 0 : _a.call(slots);
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
  var _a, _b, _c, _d, _e, _f, _g;
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
  (_a = options.server) != null ? _a : options.server = true;
  (_b = options.default) != null ? _b : options.default = getDefault;
  (_c = options.getCachedData) != null ? _c : options.getCachedData = getDefaultCachedData;
  (_d = options.lazy) != null ? _d : options.lazy = false;
  (_e = options.immediate) != null ? _e : options.immediate = true;
  (_f = options.deep) != null ? _f : options.deep = asyncDataDefaults.deep;
  (_g = options.dedupe) != null ? _g : options.dedupe = "cancel";
  options._functionName || "useAsyncData";
  nuxtApp._asyncData[key.value];
  function createInitialFetch() {
    var _a2;
    const initialFetchOptions = { cause: "initial", dedupe: options.dedupe };
    if (!((_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2._init)) {
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
    data: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.data;
    }),
    pending: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.pending;
    }),
    status: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.status;
    }),
    error: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.error;
    }),
    refresh: (...args2) => {
      var _a2;
      if (!((_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2._init)) {
        const initialFetch2 = createInitialFetch();
        return initialFetch2();
      }
      return nuxtApp._asyncData[key.value].execute(...args2);
    },
    execute: (...args2) => asyncReturn.refresh(...args2),
    clear: () => {
      const entry = nuxtApp._asyncData[key.value];
      if (entry == null ? void 0 : entry._abortController) {
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
      var _a;
      return (_a = getter()) == null ? void 0 : _a.value;
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
  var _a, _b;
  (_b = (_a = nuxtApp.payload._errors)[key]) != null ? _b : _a[key] = asyncDataDefaults.errorValue;
  const hasCustomGetCachedData = options.getCachedData !== getDefaultCachedData;
  const handler = _handler ;
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
      var _a2, _b2;
      const [_opts, newValue = void 0] = args;
      const opts = _opts && newValue === void 0 && typeof _opts === "object" ? _opts : {};
      if (nuxtApp._asyncDataPromises[key]) {
        if (isDefer((_a2 = opts.dedupe) != null ? _a2 : options.dedupe)) {
          return nuxtApp._asyncDataPromises[key];
        }
      }
      if (opts.cause === "initial" || nuxtApp.isHydrating) {
        const cachedData = "cachedData" in opts ? opts.cachedData : options.getCachedData(key, nuxtApp, { cause: (_b2 = opts.cause) != null ? _b2 : "refresh:manual" });
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
          var _a3, _b3;
          try {
            const timeout = (_a3 = opts.timeout) != null ? _a3 : options.timeout;
            const mergedSignal = mergeAbortSignals([(_b3 = asyncData._abortController) == null ? void 0 : _b3.signal, opts == null ? void 0 : opts.signal], cleanupController.signal, timeout);
            if (mergedSignal.aborted) {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason != null ? reason : "Aborted"), "AbortError"));
              return;
            }
            mergedSignal.addEventListener("abort", () => {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason != null ? reason : "Aborted"), "AbortError"));
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
        var _a3;
        if (nuxtApp._asyncDataPromises[key] && nuxtApp._asyncDataPromises[key] !== promise) {
          return nuxtApp._asyncDataPromises[key];
        }
        if ((_a3 = asyncData._abortController) == null ? void 0 : _a3.signal.aborted) {
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
      var _a2;
      unsubRefreshAsyncData();
      if ((_a2 = nuxtApp._asyncData[key]) == null ? void 0 : _a2._init) {
        nuxtApp._asyncData[key]._init = false;
      }
      if (!hasCustomGetCachedData) {
        nextTick(() => {
          var _a3;
          if (!((_a3 = nuxtApp._asyncData[key]) == null ? void 0 : _a3._init)) {
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
  var _a, _b, _c;
  const list = signals.filter((s) => !!s);
  if (typeof timeout === "number" && timeout >= 0) {
    const timeoutSignal = (_a = AbortSignal.timeout) == null ? void 0 : _a.call(AbortSignal, timeout);
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
      const reason = (_b = sig.reason) != null ? _b : new DOMException("Aborted", "AbortError");
      try {
        controller.abort(reason);
      } catch {
        controller.abort();
      }
      return controller.signal;
    }
  }
  const onAbort = () => {
    var _a2;
    const abortedSignal = list.find((s) => s.aborted);
    const reason = (_a2 = abortedSignal == null ? void 0 : abortedSignal.reason) != null ? _a2 : new DOMException("Aborted", "AbortError");
    try {
      controller.abort(reason);
    } catch {
      controller.abort();
    }
  };
  for (const sig of list) {
    (_c = sig.addEventListener) == null ? void 0 : _c.call(sig, "abort", onAbort, { once: true, signal: cleanupSignal });
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
  const routes = Array.isArray(data == null ? void 0 : data.routes) ? data.routes : [];
  const explicitHomepage = routes.find((route) => route.isHomepage || normalizePublicPath(route.path) === "/");
  if (explicitHomepage) {
    return normalizePublicPath(explicitHomepage.path);
  }
  const fallbackSegments = [data == null ? void 0 : data.siteKey, data == null ? void 0 : data.publicIdentifier].filter(
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
  var _a, _b, _c;
  if (!node || typeof node !== "object") {
    return 0;
  }
  const candidate = node;
  return ((_a = candidate.content) == null ? void 0 : _a.length) || ((_b = candidate.children) == null ? void 0 : _b.length) || ((_c = candidate.elements) == null ? void 0 : _c.length) || 0;
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
  const headerCount = getSchemaChildCount(site == null ? void 0 : site.headerSchema);
  const footerCount = getSchemaChildCount(site == null ? void 0 : site.footerSchema);
  return headerCount === 0 || footerCount === 0;
}
async function withFreshSiteShell(payload, host, apiBase) {
  if (!siteShellLooksEmpty(payload.site)) {
    return payload;
  }
  try {
    const siteResponse = await fetchPublicSite(host, apiBase);
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
async function fetchResolvedPublicPage(host, path, apiBase) {
  try {
    const payload = await fetchPublicPage(host, path, apiBase);
    return await withFreshSiteShell(payload, host, apiBase);
  } catch (error) {
    if (path !== "/" || getStatusCode(error) !== 404) {
      throw error;
    }
    let fallbackPath = null;
    try {
      const routes = await fetchPublicRoutes(host, apiBase);
      fallbackPath = resolveHomepageFallbackPath(routes);
    } catch {
      fallbackPath = null;
    }
    if (!fallbackPath || fallbackPath === path) {
      throw error;
    }
    try {
      const payload = await fetchPublicPage(host, fallbackPath, apiBase);
      return await withFreshSiteShell(payload, host, apiBase);
    } catch (fallbackError) {
      if (getStatusCode(fallbackError) === 404) {
        throw error;
      }
      throw fallbackError;
    }
  }
}
async function usePublicPage() {
  var _a, _b, _c;
  const route = useRoute();
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  const host = getRequestHost();
  const path = computed(() => normalizePublicPath(route.path) || "/");
  const key = computed(() => `public-page:${host}:${path.value}`);
  const { data, error } = await useAsyncData(
    key,
    () => fetchResolvedPublicPage(host, path.value, apiBase),
    {
      watch: [path],
      default: () => null
    }
  );
  if (error.value) {
    throw resolvePageError(error.value, host, config.public.apiBase);
  }
  if (!((_a = data.value) == null ? void 0 : _a.entity) || !((_b = data.value) == null ? void 0 : _b.site) || !((_c = data.value) == null ? void 0 : _c.page)) {
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
  const preferredHost = normalizeHost((source == null ? void 0 : source.canonicalHost) || (source == null ? void 0 : source.resolvedHost) || normalizedRequestHost) || normalizedRequestHost;
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
    ((seo == null ? void 0 : seo.robots) || fallback).split(",").map((directive) => directive.trim()).filter(Boolean)
  );
  if (seo == null ? void 0 : seo.noindex) {
    directives.delete("index");
    directives.delete("follow");
    directives.add("noindex");
    directives.add("nofollow");
  }
  if (seo == null ? void 0 : seo.noarchive) {
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const entity = (_a = payload.value) == null ? void 0 : _a.entity;
    const site = (_b = payload.value) == null ? void 0 : _b.site;
    const page = (_c = payload.value) == null ? void 0 : _c.page;
    const seo = page == null ? void 0 : page.seo;
    const siteName = ((_d = site == null ? void 0 : site.defaults) == null ? void 0 : _d.siteName) || (entity == null ? void 0 : entity.siteKey) || "Website";
    const publicHost = resolvePublicHost(entity, requestHost, config.public.platformBaseDomain);
    const baseUrl = publicHost ? toAbsoluteUrl(`${siteProtocol}://${publicHost}`) : null;
    const fallbackTitle = (page == null ? void 0 : page.title) || siteName;
    const title = buildTitle((seo == null ? void 0 : seo.title) || fallbackTitle, (_e = site == null ? void 0 : site.defaults) == null ? void 0 : _e.titleSuffix);
    const description = (seo == null ? void 0 : seo.description) || (page == null ? void 0 : page.description) || ((_f = site == null ? void 0 : site.defaults) == null ? void 0 : _f.defaultDescription) || "";
    const canonical = toAbsoluteUrl((seo == null ? void 0 : seo.canonicalUrl) || normalizePath(page == null ? void 0 : page.path), baseUrl);
    const robots = buildRobots(seo, ((_g = site == null ? void 0 : site.defaults) == null ? void 0 : _g.robotsDefault) || "index,follow");
    const ogImage = toAbsoluteUrl((seo == null ? void 0 : seo.ogImage) || ((_h = site == null ? void 0 : site.defaults) == null ? void 0 : _h.defaultOgImage), baseUrl);
    const twitterImage = toAbsoluteUrl((seo == null ? void 0 : seo.twitterImage) || ogImage, baseUrl);
    const favicon = toAbsoluteUrl(entity == null ? void 0 : entity.favicon, baseUrl);
    const structuredData = normalizeStructuredData((seo == null ? void 0 : seo.structuredData) || ((_i = site == null ? void 0 : site.defaults) == null ? void 0 : _i.structuredDataJsonLd));
    const link = [];
    const meta = [];
    if (description) {
      meta.push({ name: "description", content: description });
    }
    meta.push({ name: "robots", content: robots });
    meta.push({ property: "og:title", content: (seo == null ? void 0 : seo.ogTitle) || title });
    meta.push({ property: "og:description", content: (seo == null ? void 0 : seo.ogDescription) || description });
    meta.push({ property: "og:type", content: (seo == null ? void 0 : seo.ogType) || "website" });
    {
      meta.push({ property: "og:site_name", content: siteName });
    }
    if (canonical) {
      meta.push({ property: "og:url", content: canonical });
    }
    meta.push({ name: "twitter:card", content: (seo == null ? void 0 : seo.twitterCard) || ((_j = site == null ? void 0 : site.defaults) == null ? void 0 : _j.defaultTwitterCard) || "summary_large_image" });
    meta.push({ name: "twitter:title", content: (seo == null ? void 0 : seo.twitterTitle) || title });
    meta.push({ name: "twitter:description", content: (seo == null ? void 0 : seo.twitterDescription) || description });
    if (ogImage) {
      meta.push({ property: "og:image", content: ogImage });
    }
    if (twitterImage) {
      meta.push({ name: "twitter:image", content: twitterImage });
    }
    if (seo == null ? void 0 : seo.articlePublishedTime) {
      meta.push({ property: "article:published_time", content: seo.articlePublishedTime });
    }
    if (seo == null ? void 0 : seo.articleModifiedTime) {
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
        lang: (entity == null ? void 0 : entity.defaultLocale) || "en"
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
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "PublicSitePage",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const payload = ([__temp, __restore] = withAsyncContext(() => usePublicPage()), __temp = await __temp, __restore(), __temp);
    usePublicSeo(payload);
    const cssVars = computed(() => {
      var _a, _b;
      return buildCssVars((_b = (_a = payload.value) == null ? void 0 : _a.site) == null ? void 0 : _b.builderStyles);
    });
    const runtimeMenus = computed(() => {
      var _a, _b;
      return Array.isArray((_b = (_a = payload.value) == null ? void 0 : _a.site) == null ? void 0 : _b.menus) ? payload.value.site.menus : [];
    });
    const pageWidthMode = computed(() => {
      var _a, _b;
      const styles = (_b = (_a = payload.value) == null ? void 0 : _a.site) == null ? void 0 : _b.builderStyles;
      const page = styles && typeof styles === "object" && !Array.isArray(styles) ? styles.page : null;
      if (!page || typeof page !== "object" || Array.isArray(page)) {
        return "contained";
      }
      return page.widthMode === "full" ? "full" : "contained";
    });
    const runtimeHeaderSchema = computed(() => {
      var _a, _b;
      return (_b = (_a = payload.value) == null ? void 0 : _a.site) == null ? void 0 : _b.headerSchema;
    });
    const runtimeHeaderOverlay = computed(() => {
      var _a, _b;
      const headerSchema = (_b = (_a = payload.value) == null ? void 0 : _a.site) == null ? void 0 : _b.headerSchema;
      if (!headerSchema || typeof headerSchema !== "object" || Array.isArray(headerSchema)) {
        return false;
      }
      const behavior = "behavior" in headerSchema ? headerSchema.behavior : null;
      return Boolean(
        behavior && typeof behavior === "object" && !Array.isArray(behavior) && "overlay" in behavior && behavior.overlay === true
      );
    });
    const runtimeHeaderPosition = computed(() => {
      var _a, _b;
      const headerSchema = (_b = (_a = payload.value) == null ? void 0 : _a.site) == null ? void 0 : _b.headerSchema;
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
      () => {
        var _a, _b, _c, _d, _e, _f;
        return buildResponsiveStylesheet({
          headerSchema: (_b = (_a = payload.value) == null ? void 0 : _a.site) == null ? void 0 : _b.headerSchema,
          bodySchema: (_d = (_c = payload.value) == null ? void 0 : _c.page) == null ? void 0 : _d.bodySchema,
          footerSchema: (_f = (_e = payload.value) == null ? void 0 : _e.site) == null ? void 0 : _f.footerSchema
        });
      }
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
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "wt-site",
        style: unref(cssVars),
        "data-site-key": ((_b = (_a = unref(payload)) == null ? void 0 : _a.entity) == null ? void 0 : _b.siteKey) || "",
        "data-page-width-mode": unref(pageWidthMode)
      }, _attrs))}>`);
      if ((_d = (_c = unref(payload)) == null ? void 0 : _c.site) == null ? void 0 : _d.headerSchema) {
        _push(`<header class="${ssrRenderClass([{
          "wt-page-header--sticky": unref(runtimeHeaderPosition) === "sticky" && !unref(runtimeHeaderOverlay),
          "wt-page-header--overlay": unref(runtimeHeaderOverlay)
        }, "wt-page-header"])}">`);
        _push(ssrRenderComponent(_sfc_main$1, {
          schema: (_f = (_e = unref(payload)) == null ? void 0 : _e.site) == null ? void 0 : _f.headerSchema,
          scope: "header"
        }, null, _parent));
        _push(`</header>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<main class="wt-main">`);
      _push(ssrRenderComponent(_sfc_main$1, {
        schema: (_h = (_g = unref(payload)) == null ? void 0 : _g.page) == null ? void 0 : _h.bodySchema,
        scope: "body"
      }, null, _parent));
      _push(`</main>`);
      if ((_j = (_i = unref(payload)) == null ? void 0 : _i.site) == null ? void 0 : _j.footerSchema) {
        _push(`<footer class="wt-page-footer">`);
        _push(ssrRenderComponent(_sfc_main$1, {
          schema: (_l = (_k = unref(payload)) == null ? void 0 : _k.site) == null ? void 0 : _l.footerSchema,
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
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/public/PublicSitePage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { ElementRenderer as E, _sfc_main as _, getNodeClasses as a, getNodeStyles as b, getNodeDomId as c, getNodeKey as d, getStringField as e, getBooleanField as f, getNodeChildren as g, runtimeHeaderSchemaKey as h, runtimeHeaderOverlayKey as i, normalizeSchemaNodes as j, getArrayField as k, getNodeField as l, getNodeContentRecord as m, normalizeBlockType as n, runtimeMenusKey as r };
//# sourceMappingURL=PublicSitePage-C4ABRpXM.mjs.map
