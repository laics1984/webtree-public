<script setup lang="ts">
import { getNodeClasses, getNodeContentRecord, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'

type FieldType = 'text' | 'email' | 'tel' | 'textarea'

interface RuntimeFieldDefinition {
  key: string
  label: string
  type: FieldType
  placeholder: string
  required: boolean
}

const props = defineProps<{ node: Record<string, any> }>()

const DEFAULT_FIELD_ORDER = ['firstName', 'lastName', 'email', 'phone', 'company', 'message']
const DEFAULT_FIELD_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  message: 'Project brief'
}

const content = computed(() => getNodeContentRecord(props.node))
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
const submitLabel = computed(() => getStringField(props.node, 'submitLabel') || 'Send')
const layout = computed(() => (getStringField(props.node, 'layout') || 'stacked').trim().toLowerCase())
const baseId = computed(() => String(props.node?.id || 'contact-form'))

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeFieldType(value: unknown): FieldType {
  switch (value) {
    case 'email':
    case 'tel':
    case 'textarea':
      return value
    default:
      return 'text'
  }
}

const fields = computed<RuntimeFieldDefinition[]>(() => {
  const rawFields = isRecord(content.value?.fields) ? content.value.fields : {}
  const orderedKeys = [...DEFAULT_FIELD_ORDER, ...Object.keys(rawFields).filter(key => !DEFAULT_FIELD_ORDER.includes(key))]
  const normalized = orderedKeys
    .map((key) => {
      const source = isRecord(rawFields[key]) ? rawFields[key] : {}
      const enabled = source.enabled === undefined ? DEFAULT_FIELD_ORDER.includes(key) : source.enabled !== false

      if (!enabled) {
        return null
      }

      const label = typeof source.label === 'string' && source.label.trim()
        ? source.label.trim()
        : DEFAULT_FIELD_LABELS[key] || key

      return {
        key,
        label,
        type: normalizeFieldType(source.type),
        placeholder: typeof source.placeholder === 'string' && source.placeholder.trim()
          ? source.placeholder.trim()
          : label,
        required: source.required === true
      }
    })
    .filter((field): field is RuntimeFieldDefinition => Boolean(field))

  if (normalized.length) {
    return normalized
  }

  return [
    { key: 'name', label: 'Name', type: 'text', placeholder: 'Name', required: true },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'Email', required: true },
    { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Message', required: true }
  ]
})
</script>

<template>
  <section
    class="wt-contact-form"
    :class="[nodeClasses, { 'wt-contact-form--split': layout === 'split' }]"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <form class="wt-contact-form__panel" @submit.prevent>
      <div v-for="field in fields" :key="field.key" class="wt-contact-form__field">
        <label class="wt-contact-form__label wt-ui-field-label" :for="`${baseId}-${field.key}`">
          <svg
            v-if="field.type === 'email'"
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
            v-else-if="field.type === 'tel'"
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
            v-else-if="field.type === 'textarea'"
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
          <span>{{ field.label }}</span>
          <span v-if="field.required" class="wt-contact-form__required wt-ui-pill">Required</span>
        </label>

        <textarea
          v-if="field.type === 'textarea'"
          :id="`${baseId}-${field.key}`"
          class="wt-contact-form__input wt-contact-form__textarea wt-ui-input"
          :name="field.key"
          :placeholder="field.placeholder"
          :required="field.required"
          rows="5"
        />

        <input
          v-else
          :id="`${baseId}-${field.key}`"
          class="wt-contact-form__input wt-ui-input"
          :type="field.type"
          :name="field.key"
          :placeholder="field.placeholder"
          :required="field.required"
        />
      </div>

      <button type="submit" class="wt-contact-form__submit wt-ui-button">
        {{ submitLabel }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.wt-contact-form {
  display: grid;
  gap: 2rem;
  padding: clamp(1.5rem, 3vw, 2rem);
}

.wt-contact-form--split {
  grid-template-columns: minmax(0, 1fr);
}

.wt-contact-form__panel {
  display: grid;
  gap: 0.9rem;
  padding: clamp(1rem, 2vw, 1.25rem) !important;
  border: 1px solid rgba(148, 163, 184, 0.18) !important;
  border-radius: 1rem !important;
  background: var(--builder-color-surface, #f0fdfa) !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04) !important;
}

.wt-contact-form__input,
.wt-contact-form__textarea {
  background: #ffffff !important;
}

.wt-contact-form__field {
  display: grid;
  gap: 0.45rem;
}

.wt-contact-form__label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.wt-contact-form__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--builder-color-primary, var(--wt-color-primary, #0891b2));
}

.wt-contact-form__required {
  padding: 0.12rem 0.4rem;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
}

.wt-contact-form__textarea {
  resize: vertical;
  min-height: 8rem;
}

.wt-contact-form__submit {
  margin-top: 0.35rem;
  width: 100%;
}

</style>
