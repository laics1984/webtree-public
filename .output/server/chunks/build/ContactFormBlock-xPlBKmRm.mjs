globalThis.__timing__.logStart('Load chunks/build/ContactFormBlock-xPlBKmRm');import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { m as getNodeContentRecord, a as getNodeClasses, b as getNodeStyles, c as getNodeDomId, e as getStringField } from './default-yxUPDbdc.mjs';
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
    const DEFAULT_FIELD_PLACEHOLDERS = {
      firstName: "Jane",
      lastName: "Tan",
      email: "jane@company.com",
      phone: "+60 12-345 6789",
      company: "WebTree",
      message: "Tell us what you need help building."
    };
    const DEFAULT_FIELD_TYPES = {
      firstName: "text",
      lastName: "text",
      email: "email",
      phone: "tel",
      company: "text",
      message: "textarea"
    };
    const content = computed(() => getNodeContentRecord(props.node));
    const nodeClasses = computed(() => getNodeClasses(props.node));
    const nodeStyles = computed(() => getNodeStyles(props.node));
    const nodeDomId = computed(() => getNodeDomId(props.node) || void 0);
    const submitLabel = computed(() => getStringField(props.node, "submitLabel") || "Send enquiry");
    const baseId = computed(() => {
      var _a;
      return String(((_a = props.node) == null ? void 0 : _a.id) || "contact-form");
    });
    function isRecord(value) {
      return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }
    function normalizeFieldType(value, fallback) {
      switch (value) {
        case "email":
        case "tel":
        case "textarea":
        case "text":
          return value;
        default:
          return fallback;
      }
    }
    const fields = computed(() => {
      var _a;
      const rawFields = isRecord((_a = content.value) == null ? void 0 : _a.fields) ? content.value.fields : {};
      return DEFAULT_FIELD_ORDER.map((key) => {
        const source = isRecord(rawFields[key]) ? rawFields[key] : {};
        const mode = source.mode === "off" || source.mode === "optional" || source.mode === "required" ? source.mode : null;
        let enabled;
        let required;
        if (mode) {
          enabled = mode !== "off";
          required = mode === "required";
        } else {
          const defaultEnabled = key !== "company";
          const defaultRequired = key === "firstName" || key === "lastName" || key === "email" || key === "message";
          enabled = source.enabled === void 0 ? defaultEnabled : source.enabled !== false;
          required = source.required === void 0 ? defaultRequired && enabled : source.required === true;
        }
        if (!enabled) return null;
        const label = typeof source.label === "string" && source.label.trim() ? source.label.trim() : DEFAULT_FIELD_LABELS[key];
        const placeholder = typeof source.placeholder === "string" && source.placeholder.trim() ? source.placeholder.trim() : DEFAULT_FIELD_PLACEHOLDERS[key];
        return {
          key,
          label,
          type: normalizeFieldType(source.type, DEFAULT_FIELD_TYPES[key]),
          placeholder,
          required
        };
      }).filter((field) => Boolean(field));
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        class: ["wt-contact-form", unref(nodeClasses)],
        style: unref(nodeStyles),
        "data-wt-node-id": unref(nodeDomId)
      }, _attrs))} data-v-7e28c0be><div class="wt-contact-form__shells" data-v-7e28c0be><div class="wt-contact-form__glow" aria-hidden="true" data-v-7e28c0be></div><form class="wt-contact-form__panel" data-v-7e28c0be><!--[-->`);
      ssrRenderList(unref(fields), (field) => {
        _push(`<label class="wt-contact-form__field"${ssrRenderAttr("for", `${unref(baseId)}-${field.key}`)} data-v-7e28c0be><span class="wt-contact-form__label" data-v-7e28c0be>`);
        if (field.key === "email") {
          _push(`<svg class="wt-contact-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-v-7e28c0be><rect x="3" y="5" width="18" height="14" rx="2" data-v-7e28c0be></rect><path d="m3 7 9 6 9-6" data-v-7e28c0be></path></svg>`);
        } else if (field.key === "phone") {
          _push(`<svg class="wt-contact-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-v-7e28c0be><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" data-v-7e28c0be></path></svg>`);
        } else if (field.key === "message") {
          _push(`<svg class="wt-contact-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-v-7e28c0be><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" data-v-7e28c0be></path></svg>`);
        } else if (field.key === "company") {
          _push(`<svg class="wt-contact-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-v-7e28c0be><path d="M3 21V7a2 2 0 0 1 2-2h6v16" data-v-7e28c0be></path><path d="M11 21V3h8a2 2 0 0 1 2 2v16" data-v-7e28c0be></path><path d="M9 9h0M9 13h0M9 17h0M15 9h0M15 13h0M15 17h0" data-v-7e28c0be></path></svg>`);
        } else {
          _push(`<svg class="wt-contact-form__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-v-7e28c0be><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" data-v-7e28c0be></path><circle cx="12" cy="7" r="4" data-v-7e28c0be></circle></svg>`);
        }
        _push(`<span class="wt-contact-form__label-text" data-v-7e28c0be>${ssrInterpolate(field.label)}</span>`);
        if (field.required) {
          _push(`<span class="wt-contact-form__required" data-v-7e28c0be>Required</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</span>`);
        if (field.type === "textarea") {
          _push(`<textarea${ssrRenderAttr("id", `${unref(baseId)}-${field.key}`)} class="wt-contact-form__control wt-contact-form__textarea"${ssrRenderAttr("name", field.key)}${ssrRenderAttr("placeholder", field.placeholder)}${ssrIncludeBooleanAttr(field.required) ? " required" : ""} rows="5" data-v-7e28c0be></textarea>`);
        } else {
          _push(`<input${ssrRenderAttr("id", `${unref(baseId)}-${field.key}`)} class="wt-contact-form__control"${ssrRenderAttr("type", field.type)}${ssrRenderAttr("name", field.key)}${ssrRenderAttr("placeholder", field.placeholder)}${ssrIncludeBooleanAttr(field.required) ? " required" : ""} data-v-7e28c0be>`);
        }
        _push(`</label>`);
      });
      _push(`<!--]--><button type="submit" class="wt-contact-form__submit" data-v-7e28c0be>${ssrInterpolate(unref(submitLabel))}</button></form></div></section>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/blocks/ContactFormBlock.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const ContactFormBlock = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-7e28c0be"]]);

export { ContactFormBlock as default };;globalThis.__timing__.logEnd('Load chunks/build/ContactFormBlock-xPlBKmRm');
//# sourceMappingURL=ContactFormBlock-xPlBKmRm.mjs.map
