import { d as useRoute, e as __nuxt_component_0, _ as _export_sfc } from "../server.mjs";
import { defineComponent, inject, computed, ref, watch, unref, mergeProps, withCtx, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent, ssrInterpolate, ssrRenderStyle, ssrRenderAttr, ssrRenderTeleport, ssrRenderClass } from "vue/server-renderer";
import { r as runtimeMenusKey, h as runtimeHeaderSchemaKey, i as runtimeHeaderOverlayKey, a as getNodeClasses, b as getNodeStyles, c as getNodeDomId, e as getStringField, j as normalizeSchemaNodes, k as getArrayField, l as getNodeField, g as getNodeChildren, n as normalizeBlockType } from "./default-yxUPDbdc.js";
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
  __name: "MenuBlock",
  __ssrInlineRender: true,
  props: {
    node: {}
  },
  setup(__props) {
    function expandHexColor(value) {
      return value.split("").map((character) => character + character).join("");
    }
    function extractVarFallback(value) {
      const match = value.match(/var\(\s*--[^,)]+(?:,\s*([^)]+))?\)/i);
      return match?.[1]?.trim() ?? null;
    }
    function parseColor(value) {
      if (!value) {
        return null;
      }
      const normalized = value.trim();
      if (!normalized) {
        return null;
      }
      if (normalized.startsWith("var(")) {
        return parseColor(extractVarFallback(normalized));
      }
      if (normalized.startsWith("#")) {
        const raw = normalized.slice(1);
        const hex = raw.length === 3 ? expandHexColor(raw) : raw.length >= 6 ? raw.slice(0, 6) : "";
        if (hex.length !== 6) {
          return null;
        }
        const r = Number.parseInt(hex.slice(0, 2), 16);
        const g = Number.parseInt(hex.slice(2, 4), 16);
        const b = Number.parseInt(hex.slice(4, 6), 16);
        if ([r, g, b].some((channel) => Number.isNaN(channel))) {
          return null;
        }
        return { r, g, b };
      }
      if (normalized.startsWith("rgb")) {
        const match = normalized.match(
          /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*[0-9.]+\s*)?\)$/i
        );
        if (!match) {
          return null;
        }
        return {
          r: Number.parseFloat(match[1]),
          g: Number.parseFloat(match[2]),
          b: Number.parseFloat(match[3])
        };
      }
      const namedColor = normalized.toLowerCase();
      if (namedColor === "white") {
        return { r: 255, g: 255, b: 255 };
      }
      if (namedColor === "black") {
        return { r: 0, g: 0, b: 0 };
      }
      return null;
    }
    function toLinearSrgb(value) {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }
    function getRelativeLuminance(value) {
      const parsed = parseColor(value);
      if (!parsed) {
        return null;
      }
      return 0.2126 * toLinearSrgb(parsed.r) + 0.7152 * toLinearSrgb(parsed.g) + 0.0722 * toLinearSrgb(parsed.b);
    }
    function getContrastRatio(foreground, background) {
      const foregroundLuminance = getRelativeLuminance(foreground);
      const backgroundLuminance = getRelativeLuminance(background);
      if (foregroundLuminance === null || backgroundLuminance === null) {
        return null;
      }
      const lighter = Math.max(foregroundLuminance, backgroundLuminance);
      const darker = Math.min(foregroundLuminance, backgroundLuminance);
      return (lighter + 0.05) / (darker + 0.05);
    }
    function pickAccessibleTextColor(background) {
      const candidates = ["#0f172a", "#1e293b", "#334155"];
      let bestCandidate = candidates[0];
      let bestRatio = -1;
      for (const candidate of candidates) {
        const ratio = getContrastRatio(candidate, background);
        if (ratio === null) {
          continue;
        }
        if (ratio > bestRatio) {
          bestCandidate = candidate;
          bestRatio = ratio;
        }
      }
      return bestCandidate;
    }
    const props = __props;
    const route = useRoute();
    const runtimeMenus = inject(runtimeMenusKey, computed(() => []));
    const runtimeHeaderSchema = inject(
      runtimeHeaderSchemaKey,
      computed(() => null)
    );
    const runtimeHeaderOverlay = inject(runtimeHeaderOverlayKey, computed(() => false));
    const isMobileMenuOpen = ref(false);
    ref(null);
    const nodeClasses = computed(() => getNodeClasses(props.node));
    const nodeStyles = computed(() => getNodeStyles(props.node));
    const nodeDomId = computed(() => getNodeDomId(props.node) || void 0);
    const colorMode = computed(() => (getStringField(props.node, "colorMode") || "").trim().toLowerCase());
    const variant = computed(() => (getStringField(props.node, "variant") || "header-inline").trim().toLowerCase());
    const slot = computed(() => (getStringField(props.node, "slot") || "").trim().toLowerCase());
    const menuLabel = computed(() => getStringField(props.node, "menuLabel") || "Site navigation");
    const isHeaderPrimaryMenu = computed(() => slot.value === "primary" || variant.value === "header-inline");
    const isHeaderUtilityMenu = computed(() => slot.value === "utility" || variant.value === "utility-inline");
    const isOverlayHeader = computed(() => runtimeHeaderOverlay.value);
    const items = computed(() => resolveMenuItemsForNode(props.node));
    const visibleItems = computed(() => items.value.filter((item) => item?.visible !== false));
    const flattenedVisibleItems = computed(() => flattenMenuItems(visibleItems.value));
    const headerSupplemental = computed(() => {
      const utilityItems = [];
      const actionLinks = [];
      const currentNodeId = nodeDomId.value;
      collectHeaderElements(normalizeSchemaNodes(runtimeHeaderSchema.value), (node) => {
        const candidateId = getNodeDomId(node);
        if (candidateId && candidateId === currentNodeId) {
          return;
        }
        const type = normalizeBlockType(getStringField(node, "type"));
        if (type === "header") {
          return;
        }
        if (type === "menu") {
          const nodeSlot = (getStringField(node, "slot") || "").trim().toLowerCase();
          const nodeVariant = (getStringField(node, "variant") || "").trim().toLowerCase();
          const isUtilityMenu = nodeSlot === "utility" || nodeVariant === "utility-inline";
          if (!isUtilityMenu) {
            return;
          }
          utilityItems.push(...resolveMenuItemsForNode(node).filter((item) => item?.visible !== false));
          return;
        }
        if (type !== "link") {
          return;
        }
        const href = getStringField(node, "href") || "";
        const label = getStringField(node, "innerText", "label", "text") || "";
        if (!href.trim() || !label.trim()) {
          return;
        }
        actionLinks.push({
          id: candidateId || label,
          href,
          label,
          rel: getStringField(node, "rel"),
          target: getStringField(node, "target"),
          styles: getNodeStyles(node)
        });
      });
      return {
        utilityItems,
        actionLinks
      };
    });
    const flattenedUtilityItems = computed(
      () => flattenMenuItems(headerSupplemental.value.utilityItems)
    );
    const resolvedStyles = computed(() => {
      if (colorMode.value !== "auto") {
        return nodeStyles.value;
      }
      const styles = { ...nodeStyles.value };
      delete styles.color;
      return styles;
    });
    const toggleTextColor = computed(() => {
      if (isOverlayHeader.value) {
        return "#ffffff";
      }
      const preferredColor = typeof nodeStyles.value.color === "string" ? nodeStyles.value.color : "var(--wt-color-text, #0f172a)";
      const contrastRatio = getContrastRatio(preferredColor, "#ffffff");
      if (contrastRatio !== null && contrastRatio >= 4.5) {
        return preferredColor;
      }
      return pickAccessibleTextColor("#ffffff");
    });
    watch(
      () => route.fullPath,
      () => {
        closeMobileMenu();
      }
    );
    watch(isMobileMenuOpen, (isOpen) => {
      {
        return;
      }
    });
    function closeMobileMenu() {
      isMobileMenuOpen.value = false;
    }
    function resolveMenuItemsForNode(node) {
      const directItems = getArrayField(node, "items");
      if (directItems.length) {
        return directItems;
      }
      const explicitMenuId = getStringField(node, "menuId");
      const nodeSlot = getStringField(node, "slot");
      const label = getStringField(node, "menuLabel");
      const menu = runtimeMenus.value.find((entry) => {
        if (explicitMenuId) {
          return entry.id === explicitMenuId;
        }
        return nodeSlot && entry.purpose === nodeSlot || label && entry.name === label;
      });
      return Array.isArray(menu?.items) ? menu.items : [];
    }
    function collectHeaderElements(nodes, visitor) {
      for (const node of nodes) {
        if (getNodeField(node, "visible") === false) {
          continue;
        }
        visitor(node);
        collectHeaderElements(getNodeChildren(node), visitor);
      }
    }
    function flattenMenuItems(items2, depth = 0) {
      const flattened = [];
      for (const item of items2) {
        if (!item || item.visible === false) {
          continue;
        }
        const href = typeof item.href === "string" && item.href.trim() ? item.href : "#";
        const label = typeof item.label === "string" && item.label.trim() ? item.label : "Link";
        flattened.push({
          id: typeof item.id === "string" && item.id.trim() ? item.id : `${depth}:${href}:${label}`,
          href,
          label,
          target: item.target,
          rel: item.rel,
          depth
        });
        if (Array.isArray(item.children) && item.children.length) {
          flattened.push(...flattenMenuItems(item.children, depth + 1));
        }
      }
      return flattened;
    }
    function getMobileItemStyle(depth) {
      return {
        paddingLeft: `${12 + depth * 16}px`
      };
    }
    function getActionLinkStyle(actionLink) {
      return {
        backgroundColor: typeof actionLink.styles.backgroundColor === "string" ? actionLink.styles.backgroundColor : "var(--builder-button-background, #2563eb)",
        border: typeof actionLink.styles.border === "string" ? actionLink.styles.border : void 0,
        borderRadius: typeof actionLink.styles.borderRadius === "string" || typeof actionLink.styles.borderRadius === "number" ? actionLink.styles.borderRadius : "18px",
        color: typeof actionLink.styles.color === "string" ? actionLink.styles.color : "var(--builder-button-text, #ffffff)",
        padding: typeof actionLink.styles.padding === "string" || typeof actionLink.styles.padding === "number" ? actionLink.styles.padding : "14px 18px",
        textDecoration: "none"
      };
    }
    function isExternalHref(href) {
      return typeof href === "string" && /^(https?:)?\/\//.test(href);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      if (unref(isHeaderPrimaryMenu)) {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: ["wt-menu-shell wt-menu-shell--header-primary", unref(nodeClasses)],
          style: unref(resolvedStyles),
          "data-wt-node-id": unref(nodeDomId)
        }, _attrs))} data-v-45331e58><nav class="wt-menu wt-menu--desktop" data-v-45331e58><!--[-->`);
        ssrRenderList(unref(visibleItems), (item) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: item.href || item.label,
            class: "wt-menu-link wt-ui-link",
            to: item.href || "#",
            target: item.target || void 0,
            rel: item.rel || void 0,
            external: isExternalHref(item.href)
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(item.label)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(item.label), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></nav><div class="wt-header-menu-toggle" data-v-45331e58><button type="button" class="wt-header-menu-toggle__button wt-ui-button wt-ui-menu-button" style="${ssrRenderStyle({ color: unref(toggleTextColor), borderColor: unref(isOverlayHeader) ? "rgba(255,255,255,0.24)" : "rgba(148,163,184,0.35)" })}"${ssrRenderAttr("aria-expanded", unref(isMobileMenuOpen))}${ssrRenderAttr("aria-label", `Open ${unref(menuLabel)}`)} data-v-45331e58><span class="wt-header-menu-toggle__bars" aria-hidden="true" data-v-45331e58><span data-v-45331e58></span><span data-v-45331e58></span><span data-v-45331e58></span></span><span data-v-45331e58>Menu</span></button></div>`);
        ssrRenderTeleport(_push, (_push2) => {
          if (unref(isMobileMenuOpen)) {
            _push2(`<div class="${ssrRenderClass([{ "wt-mobile-menu-sheet--overlay": unref(isOverlayHeader) }, "wt-mobile-menu-sheet"])}" data-v-45331e58><div class="${ssrRenderClass([{ "wt-ui-sheet--overlay": unref(isOverlayHeader) }, "wt-mobile-menu-sheet__surface wt-ui-sheet"])}" data-v-45331e58><div class="wt-mobile-menu-sheet__top" data-v-45331e58><button type="button" class="wt-mobile-menu-sheet__close wt-ui-button wt-ui-menu-button"${ssrRenderAttr("aria-label", `Close ${unref(menuLabel)}`)} data-v-45331e58><span class="wt-mobile-menu-sheet__close-mark" aria-hidden="true" data-v-45331e58>X</span><span data-v-45331e58>Close</span></button></div><div class="wt-mobile-menu-sheet__body" data-v-45331e58><nav class="wt-mobile-menu-list"${ssrRenderAttr("aria-label", unref(menuLabel))} data-v-45331e58><!--[-->`);
            ssrRenderList(unref(flattenedVisibleItems), (item) => {
              _push2(ssrRenderComponent(_component_NuxtLink, {
                key: `${item.id}:${item.depth}`,
                class: "wt-mobile-menu-link wt-ui-link wt-ui-divider-link",
                style: getMobileItemStyle(item.depth),
                to: item.href,
                target: item.target || void 0,
                rel: item.rel || void 0,
                external: isExternalHref(item.href),
                onClick: closeMobileMenu
              }, {
                default: withCtx((_, _push3, _parent2, _scopeId) => {
                  if (_push3) {
                    _push3(`${ssrInterpolate(item.label)}`);
                  } else {
                    return [
                      createTextVNode(toDisplayString(item.label), 1)
                    ];
                  }
                }),
                _: 2
              }, _parent));
            });
            _push2(`<!--]--></nav>`);
            if (unref(flattenedUtilityItems).length) {
              _push2(`<div class="wt-mobile-menu-section" data-v-45331e58><p class="wt-mobile-menu-section__title" data-v-45331e58>Utility</p><nav class="wt-mobile-menu-list" aria-label="Utility links" data-v-45331e58><!--[-->`);
              ssrRenderList(unref(flattenedUtilityItems), (item) => {
                _push2(ssrRenderComponent(_component_NuxtLink, {
                  key: `utility:${item.id}:${item.depth}`,
                  class: "wt-mobile-menu-link wt-mobile-menu-link--secondary wt-ui-link wt-ui-divider-link",
                  style: getMobileItemStyle(item.depth),
                  to: item.href,
                  target: item.target || void 0,
                  rel: item.rel || void 0,
                  external: isExternalHref(item.href),
                  onClick: closeMobileMenu
                }, {
                  default: withCtx((_, _push3, _parent2, _scopeId) => {
                    if (_push3) {
                      _push3(`${ssrInterpolate(item.label)}`);
                    } else {
                      return [
                        createTextVNode(toDisplayString(item.label), 1)
                      ];
                    }
                  }),
                  _: 2
                }, _parent));
              });
              _push2(`<!--]--></nav></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(headerSupplemental).actionLinks.length) {
              _push2(`<div class="wt-mobile-menu-actions" data-v-45331e58><!--[-->`);
              ssrRenderList(unref(headerSupplemental).actionLinks, (actionLink) => {
                _push2(ssrRenderComponent(_component_NuxtLink, {
                  key: actionLink.id,
                  class: "wt-mobile-menu-action wt-ui-button wt-ui-link",
                  to: actionLink.href,
                  target: actionLink.target || void 0,
                  rel: actionLink.rel || void 0,
                  external: isExternalHref(actionLink.href),
                  style: getActionLinkStyle(actionLink),
                  onClick: closeMobileMenu
                }, {
                  default: withCtx((_, _push3, _parent2, _scopeId) => {
                    if (_push3) {
                      _push3(`${ssrInterpolate(actionLink.label)}`);
                    } else {
                      return [
                        createTextVNode(toDisplayString(actionLink.label), 1)
                      ];
                    }
                  }),
                  _: 2
                }, _parent));
              });
              _push2(`<!--]--></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div></div>`);
          } else {
            _push2(`<!---->`);
          }
        }, "body", false, _parent);
        _push(`</div>`);
      } else {
        _push(`<nav${ssrRenderAttrs(mergeProps({
          class: ["wt-menu", [unref(nodeClasses), { "wt-menu--hide-mobile": unref(isHeaderUtilityMenu) }]],
          style: unref(resolvedStyles),
          "data-wt-node-id": unref(nodeDomId)
        }, _attrs))} data-v-45331e58><!--[-->`);
        ssrRenderList(unref(visibleItems), (item) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: item.href || item.label,
            class: "wt-menu-link wt-ui-link",
            to: item.href || "#",
            target: item.target || void 0,
            rel: item.rel || void 0,
            external: isExternalHref(item.href)
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(item.label)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(item.label), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></nav>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/blocks/MenuBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const MenuBlock = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-45331e58"]]);
export {
  MenuBlock as default
};
//# sourceMappingURL=MenuBlock-DyaFmzDA.js.map
