<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    hint?: string
    error?: string
    name?: string
    min?: string
    max?: string
    required?: boolean
    disabled?: boolean
  }>(),
  {
    hint: '',
    error: '',
    name: undefined,
    min: undefined,
    max: undefined,
    required: false,
    disabled: false,
  },
)

const model = defineModel<string>({ default: '' })
const generatedId = useId()
const inputId = `date-picker-${generatedId}`
const hintId = computed(() => (props.hint ? `${inputId}-hint` : undefined))
const errorId = computed(() => (props.error ? `${inputId}-error` : undefined))
const describedBy = computed(() =>
  [hintId.value, errorId.value].filter(Boolean).join(' ') || undefined,
)

const clearDate = () => {
  model.value = ''
}
</script>

<template>
  <div class="date-picker" :class="{ 'date-picker--error': error }">
    <label class="date-picker__label" :for="inputId">
      {{ label }}
      <span v-if="!required" class="date-picker__optional">Optional</span>
    </label>

    <div class="date-picker__control">
      <input
        :id="inputId"
        v-model="model"
        type="date"
        :name="name"
        :min="min"
        :max="max"
        :required="required"
        :disabled="disabled"
        :aria-describedby="describedBy"
        :aria-invalid="error ? 'true' : undefined"
      />

      <button
        v-if="model"
        class="date-picker__clear"
        type="button"
        :aria-label="`Clear ${label.toLowerCase()}`"
        :disabled="disabled"
        @click="clearDate"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="m5 5 10 10M15 5 5 15" />
        </svg>
      </button>
    </div>

    <p v-if="hint" :id="hintId" class="date-picker__hint">
      {{ hint }}
    </p>

    <p v-if="error" :id="errorId" class="date-picker__error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.date-picker {
  display: grid;
  gap: var(--space-2);
}

.date-picker__label {
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 650;
  line-height: 1.4;
}

.date-picker__optional {
  margin-left: var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 500;
}

.date-picker__control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2);
}

.date-picker input {
  width: 100%;
  min-width: 0;
  min-height: 2.75rem;
  padding: var(--space-3) var(--space-4);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  outline: none;
  font: inherit;
  line-height: 1.4;
  color-scheme: inherit;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.date-picker input:hover:not(:disabled) {
  border-color: var(--color-control-hover);
}

.date-picker input:focus-visible {
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px rgb(47 111 237 / 16%);
}

.date-picker input:disabled {
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  cursor: not-allowed;
  opacity: 0.75;
}

.date-picker--error .date-picker__label,
.date-picker__error {
  color: #b42318;
}

.date-picker--error input {
  background: #fffafa;
  border-color: #d83a3a;
}

.date-picker--error input:focus-visible {
  border-color: #b42318;
  box-shadow: 0 0 0 3px rgb(216 58 58 / 14%);
}

.date-picker__clear {
  display: grid;
  min-height: 2.75rem;
  aspect-ratio: 1;
  padding: 0;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  place-items: center;
}

.date-picker__clear:hover:not(:disabled) {
  color: var(--color-text);
  background: var(--color-surface-soft);
  border-color: var(--color-control-hover);
}

.date-picker__clear:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.date-picker__clear svg {
  width: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.date-picker__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.date-picker__error {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
}

.date-picker__error::before {
  display: grid;
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  margin-top: 0.05rem;
  color: #fff;
  background: #d83a3a;
  border-radius: 50%;
  content: '!';
  font-size: 0.6875rem;
  font-weight: 800;
  line-height: 1;
  place-items: center;
}

@media (prefers-reduced-motion: reduce) {
  .date-picker input {
    transition: none;
  }
}
</style>
