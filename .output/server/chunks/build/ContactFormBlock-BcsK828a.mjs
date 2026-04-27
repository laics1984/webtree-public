import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { m as getNodeContentRecord, a as getNodeClasses, b as getNodeStyles, c as getNodeDomId, e as getStringField } from './PublicSitePage-C4ABRpXM.mjs';
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
  __name: "ContactFormBlock",
  __ssrInlineRender: true,
  props: {
    node: {}
  },
  setup(__props) {
    const props = __props;
    const DEFAULT_FIELD_ORDER = ["firstName", "lastName", "email", "phone", "company", "message"];
    const DEFAULT_FIELD_LABELS = {
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      phone: "Phone",
      company: "Company",
      message: "Project brief"
    };
    const content = computed(() => getNodeContentRecord(props.node));
    const nodeClasses = computed(() => getNodeClasses(props.node));
    const nodeStyles = computed(() => getNodeStyles(props.node));
    const nodeDomId = computed(() => getNodeDomId(props.node) || void 0);
    const eyebrow = computed(() => getStringField(props.node, "eyebrow") || "Contact");
    const title = computed(() => getStringField(props.node, "title") || "Start the conversation");
    const description = computed(() => getStringField(props.node, "description"));
    const submitLabel = computed(() => getStringField(props.node, "submitLabel") || "Send");
    const layout = computed(() => (getStringField(props.node, "layout") || "stacked").trim().toLowerCase());
    const baseId = computed(() => {
      var _a;
      return String(((_a = props.node) == null ? void 0 : _a.id) || "contact-form");
    });
    function isRecord(value) {
      return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }
    function normalizeFieldType(value) {
      switch (value) {
        case "email":
        case "tel":
        case "textarea":
          return value;
        default:
          return "text";
      }
    }
    const fields = computed(() => {
      var _a;
      const rawFields = isRecord((_a = content.value) == null ? void 0 : _a.fields) ? content.value.fields : {};
      const orderedKeys = [...DEFAULT_FIELD_ORDER, ...Object.keys(rawFields).filter((key) => !DEFAULT_FIELD_ORDER.includes(key))];
      const normalized = orderedKeys.map((key) => {
        const source = isRecord(rawFields[key]) ? rawFields[key] : {};
        const enabled = source.enabled === void 0 ? DEFAULT_FIELD_ORDER.includes(key) : source.enabled !== false;
        if (!enabled) {
          return null;
        }
        const label = typeof source.label === "string" && source.label.trim() ? source.label.trim() : DEFAULT_FIELD_LABELS[key] || key;
        return {
          key,
          label,
          type: normalizeFieldType(source.type),
          placeholder: typeof source.placeholder === "string" && source.placeholder.trim() ? source.placeholder.trim() : label,
          required: source.required === true
        };
      }).filter((field) => Boolean(field));
      if (normalized.length) {
        return normalized;
      }
      return [
        { key: "name", label: "Name", type: "text", placeholder: "Name", required: true },
        { key: "email", label: "Email", type: "email", placeholder: "Email", required: true },
        { key: "message", label: "Message", type: "textarea", placeholder: "Message", required: true }
      ];
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        class: ["wt-contact-form", [unref(nodeClasses), { "wt-contact-form--split": unref(layout) === "split" }]],
        style: unref(nodeStyles),
        "data-wt-node-id": unref(nodeDomId)
      }, _attrs))} data-v-62aa58bc>`);
      if (unref(eyebrow) || unref(title) || unref(description)) {
        _push(`<div class="wt-contact-form__copy" data-v-62aa58bc>`);
        if (unref(eyebrow)) {
          _push(`<p class="wt-contact-form__eyebrow" data-v-62aa58bc>${ssrInterpolate(unref(eyebrow))}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(title)) {
          _push(`<h2 class="wt-contact-form__title" data-v-62aa58bc>${ssrInterpolate(unref(title))}</h2>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(description)) {
          _push(`<p class="wt-contact-form__description" data-v-62aa58bc>${ssrInterpolate(unref(description))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<form class="wt-contact-form__panel" data-v-62aa58bc><!--[-->`);
      ssrRenderList(unref(fields), (field) => {
        _push(`<div class="wt-contact-form__field" data-v-62aa58bc><label class="wt-contact-form__label"${ssrRenderAttr("for", `${unref(baseId)}-${field.key}`)} data-v-62aa58bc><span data-v-62aa58bc>${ssrInterpolate(field.label)}</span>`);
        if (field.required) {
          _push(`<span class="wt-contact-form__required" data-v-62aa58bc>Required</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</label>`);
        if (field.type === "textarea") {
          _push(`<textarea${ssrRenderAttr("id", `${unref(baseId)}-${field.key}`)} class="wt-contact-form__input wt-contact-form__textarea"${ssrRenderAttr("name", field.key)}${ssrRenderAttr("placeholder", field.placeholder)}${ssrIncludeBooleanAttr(field.required) ? " required" : ""} rows="5" data-v-62aa58bc></textarea>`);
        } else {
          _push(`<input${ssrRenderAttr("id", `${unref(baseId)}-${field.key}`)} class="wt-contact-form__input"${ssrRenderAttr("type", field.type)}${ssrRenderAttr("name", field.key)}${ssrRenderAttr("placeholder", field.placeholder)}${ssrIncludeBooleanAttr(field.required) ? " required" : ""} data-v-62aa58bc>`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--><button type="submit" class="wt-contact-form__submit" data-v-62aa58bc>${ssrInterpolate(unref(submitLabel))}</button></form></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/blocks/ContactFormBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ContactFormBlock = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-62aa58bc"]]);

export { ContactFormBlock as default };
//# sourceMappingURL=ContactFormBlock-BcsK828a.mjs.map
