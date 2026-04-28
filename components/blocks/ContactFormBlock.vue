<script setup lang="ts">
import { getNodeClasses, getNodeContentRecord, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'

type FieldType = 'text' | 'email' | 'tel' | 'textarea'
type FieldKey = 'firstName' | 'lastName' | 'email' | 'phone' | 'company' | 'message'

interface RuntimeFieldDefinition {
  key: string
  label: string
  type: FieldType
  placeholder: string
  required: boolean
}

const props = defineProps<{ node: Record<string, any> }>()

const DEFAULT_FIELD_ORDER: FieldKey[] = ['firstName', 'lastName', 'email', 'phone', 'company', 'message']
const DEFAULT_FIELD_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  message: 'Project brief'
}
const DEFAULT_FIELD_PLACEHOLDERS: Record<string, string> = {
  firstName: 'Jane',
  lastName: 'Tan',
  email: 'jane@company.com',
  phone: '+60 12-345 6789',
  company: 'WebTree',
  message: 'Tell us what you need help building.'
}
const DEFAULT_FIELD_TYPES: Record<string, FieldType> = {
  firstName: 'text',
  lastName: 'text',
  email: 'email',
  phone: 'tel',
  company: 'text',
  message: 'textarea'
}

const content = computed(() => getNodeContentRecord(props.node))
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
const submitLabel = computed(() => getStringField(props.node, 'submitLabel') || 'Send enquiry')
const baseId = computed(() => String(props.node?.id || 'contact-form'))

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeFieldType(value: unknown, fallback: FieldType): FieldType {
  switch (value) {
    case 'email':
    case 'tel':
    case 'textarea':
    case 'text':
      return value
    default:
      return fallback
  }
}

const fields = computed<RuntimeFieldDefinition[]>(() => {
  const rawFields = isRecord(content.value?.fields) ? content.value.fields : {}

  return DEFAULT_FIELD_ORDER
    .map((key) => {
      const source = isRecord(rawFields[key]) ? rawFields[key] : {}

      const mode = source.mode === 'off' || source.mode === 'optional' || source.mode === 'required'
        ? source.mode
        : null

      let enabled: boolean
      let required: boolean

      if (mode) {
        enabled = mode !== 'off'
        required = mode === 'required'
      } else {
        const defaultEnabled = key !== 'company'
        const defaultRequired = key === 'firstName' || key === 'lastName' || key === 'email' || key === 'message'
        enabled = source.enabled === undefined ? defaultEnabled : source.enabled !== false
        required = source.required === undefined ? defaultRequired && enabled : source.required === true
      }

      if (!enabled) return null

      const label = typeof source.label === 'string' && source.label.trim()
        ? source.label.trim()
        : DEFAULT_FIELD_LABELS[key]

      const placeholder = typeof source.placeholder === 'string' && source.placeholder.trim()
        ? source.placeholder.trim()
        : DEFAULT_FIELD_PLACEHOLDERS[key]

      return {
        key,
        label,
        type: normalizeFieldType(source.type, DEFAULT_FIELD_TYPES[key]),
        placeholder,
        required
      }
    })
    .filter((field): field is RuntimeFieldDefinition => Boolean(field))
})
</script>

<template>
  <section
    class="wt-contact-form"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <div class="wt-contact-form__shells">
      <div class="wt-contact-form__glow" aria-hidden="true" />

      <form class="wt-contact-form__panel" @submit.prevent>
        <label
          v-for="field in fields"
          :key="field.key"
          class="wt-contact-form__field"
          :for="`${baseId}-${field.key}`"
        >
          <span class="wt-contact-form__label">
            <svg
              v-if="field.key === 'email'"
              class="wt-contact-form__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <svg
              v-else-if="field.key === 'phone'"
              class="wt-contact-form__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
            </svg>
            <svg
              v-else-if="field.key === 'message'"
              class="wt-contact-form__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <svg
              v-else-if="field.key === 'company'"
              class="wt-contact-form__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 21V7a2 2 0 0 1 2-2h6v16" />
              <path d="M11 21V3h8a2 2 0 0 1 2 2v16" />
              <path d="M9 9h0M9 13h0M9 17h0M15 9h0M15 13h0M15 17h0" />
            </svg>
            <svg
              v-else
              class="wt-contact-form__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span class="wt-contact-form__label-text">{{ field.label }}</span>
            <span v-if="field.required" class="wt-contact-form__required">Required</span>
          </span>

          <textarea
            v-if="field.type === 'textarea'"
            :id="`${baseId}-${field.key}`"
            class="wt-contact-form__control wt-contact-form__textarea"
            :name="field.key"
            :placeholder="field.placeholder"
            :required="field.required"
            rows="5"
          />

          <input
            v-else
            :id="`${baseId}-${field.key}`"
            class="wt-contact-form__control"
            :type="field.type"
            :name="field.key"
            :placeholder="field.placeholder"
            :required="field.required"
          />
        </label>

        <button type="submit" class="wt-contact-form__submit">
          {{ submitLabel }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.wt-contact-form__shell {
  color: var(--builder-color-text, #111827);
  font-family: var(--builder-font-body, system-ui, sans-serif);
  position: relative;
  overflow: hidden;
  border-radius: 26px;
  border: 1px solid color-mix(in srgb, var(--builder-color-primary, #2563eb) 18%, transparent);
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--builder-color-background, #ffffff) 88%, white) 0%,
    color-mix(in srgb, var(--builder-color-surface, #f8fafc) 78%, var(--builder-color-primary, #2563eb)) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 24px 60px color-mix(in srgb, var(--builder-color-primary, #2563eb) 14%, transparent);
}

.wt-contact-form__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--builder-color-primary, #2563eb) 18%, transparent), transparent 42%),
    radial-gradient(circle at bottom right, color-mix(in srgb, var(--builder-color-accent, #f59e0b) 14%, transparent), transparent 34%);
}


.wt-contact-form__panel {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1.25rem;
}

@media (min-width: 640px) {
  .wt-contact-form__panel {
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .wt-contact-form__panel {
    padding: 2rem;
  }
}


.wt-contact-form__field {
  display: grid;
  gap: 0.375rem;
}

@media (min-width: 640px) {
  .wt-contact-form__field {
    gap: 0.5rem;
  }
}

.wt-contact-form__label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.7;
  color: var(--builder-color-text, #111827);
}

@media (min-width: 640px) {
  .wt-contact-form__label {
    gap: 0.5rem;
    font-size: 12px;
    letter-spacing: 0.16em;
  }
}

.wt-contact-form__icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  color: var(--builder-color-primary, #2563eb);
}

.wt-contact-form__required {
  border-radius: 999px;
  padding: 0.125rem 0.5rem;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--builder-color-primary, #2563eb);
  background: color-mix(in srgb, var(--builder-color-primary, #2563eb) 10%, transparent);
}

.wt-contact-form__control {
  width: 100%;
  height: 2.75rem;
  padding: 0 0.875rem;
  font: inherit;
  font-size: 0.875rem;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--builder-color-primary, #2563eb) 16%, transparent);
  outline: none;
  color: var(--builder-color-text, #111827);
  background-color: var(--builder-color-background, #ffffff);
  background-image: linear-gradient(
    180deg,
    color-mix(in srgb, var(--builder-color-background, #ffffff) 94%, white) 0%,
    color-mix(in srgb, var(--builder-color-surface, #f8fafc) 88%, white) 100%
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  box-sizing: border-box;
}

@media (min-width: 640px) {
  .wt-contact-form__control {
    height: 3rem;
    border-radius: 16px;
    padding: 0 1rem;
  }
}

.wt-contact-form__control::placeholder {
  opacity: 0.55;
}

.wt-contact-form__textarea {
  height: auto;
  min-height: 116px;
  padding: 0.75rem 0.875rem;
  resize: vertical;
}

@media (min-width: 640px) {
  .wt-contact-form__textarea {
    min-height: 136px;
    border-radius: 18px;
    padding: 0.75rem 1rem;
  }
}

.wt-contact-form__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 2.75rem;
  padding: 0 1rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  border: 0;
  cursor: pointer;
  background: var(--builder-button-background, var(--builder-color-primary, #2563eb));
  border-radius: var(--builder-button-radius, 14px);
  color: var(--builder-button-text, #ffffff);
  font-family: var(--builder-font-body, system-ui, sans-serif);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.18);
}

@media (min-width: 640px) {
  .wt-contact-form__submit {
    height: 3rem;
    padding: 0 1.25rem;
  }
}
</style>
