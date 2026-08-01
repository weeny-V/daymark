<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, onBeforeUnmount, ref, useId } from 'vue'

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
const open = ref(false)
const root = ref<HTMLElement>()
const visibleMonth = ref(dayjs())
const generatedId = useId()
const inputId = `date-picker-${generatedId}`
const dialogId = `${inputId}-calendar`
const hintId = computed(() => (props.hint ? `${inputId}-hint` : undefined))
const errorId = computed(() => (props.error ? `${inputId}-error` : undefined))
const describedBy = computed(
  () => [hintId.value, errorId.value].filter(Boolean).join(' ') || undefined,
)
const formattedValue = computed(() =>
  model.value ? dayjs(model.value).format('MMM D, YYYY') : 'Choose a date',
)
const monthLabel = computed(() => visibleMonth.value.format('MMMM YYYY'))
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const days = computed(() => {
  const start = visibleMonth.value.startOf('month')
  const offset = (start.day() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => start.subtract(offset, 'day').add(index, 'day'))
})

const isDisabled = (date: dayjs.Dayjs) =>
  Boolean(
    (props.min && date.isBefore(dayjs(props.min), 'day')) ||
    (props.max && date.isAfter(dayjs(props.max), 'day')),
  )
const onOutsideClick = (event: PointerEvent) => {
  if (!root.value?.contains(event.target as Node)) close()
}
const close = () => {
  open.value = false
  document.removeEventListener('pointerdown', onOutsideClick)
}
const toggle = () => {
  if (props.disabled) return
  if (open.value) return close()
  visibleMonth.value = model.value ? dayjs(model.value) : dayjs()
  open.value = true
  document.addEventListener('pointerdown', onOutsideClick)
}
const selectDate = (date: dayjs.Dayjs) => {
  if (isDisabled(date)) return
  model.value = date.format('YYYY-MM-DD')
  close()
}
const clearDate = () => {
  model.value = ''
  close()
}
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutsideClick))
</script>

<template>
  <div ref="root" class="date-picker" :class="{ 'date-picker--error': error }">
    <label class="date-picker__label" :for="inputId">
      {{ label }} <span v-if="!required" class="date-picker__optional">Optional</span>
    </label>
    <input :name="name" type="hidden" :value="model" />
    <div class="date-picker__control">
      <button
        :id="inputId"
        class="date-picker__trigger"
        type="button"
        :disabled="disabled"
        aria-haspopup="dialog"
        :aria-expanded="open"
        :aria-controls="dialogId"
        :aria-describedby="describedBy"
        :aria-invalid="error ? 'true' : undefined"
        @click="toggle"
      >
        <span :class="{ 'date-picker__placeholder': !model }">{{ formattedValue }}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 3v3m10-3v3M3.5 8h13M5 5h10a2 2 0 0 1 2 2v9H3V7a2 2 0 0 1 2-2Z" />
        </svg>
      </button>
      <button
        v-if="model"
        class="date-picker__clear"
        type="button"
        :aria-label="`Clear ${label.toLowerCase()}`"
        :disabled="disabled"
        @click="clearDate"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
      </button>
    </div>
    <div
      v-if="open"
      :id="dialogId"
      class="date-picker__calendar"
      role="dialog"
      aria-modal="false"
      :aria-label="`${label} calendar`"
    >
      <div class="date-picker__calendar-header">
        <button
          type="button"
          aria-label="Previous month"
          @click="visibleMonth = visibleMonth.subtract(1, 'month')"
        >
          ‹
        </button>
        <strong aria-live="polite">{{ monthLabel }}</strong>
        <button
          type="button"
          aria-label="Next month"
          @click="visibleMonth = visibleMonth.add(1, 'month')"
        >
          ›
        </button>
      </div>
      <div class="date-picker__grid" role="grid">
        <span v-for="weekday in weekdays" :key="weekday" class="date-picker__weekday">{{
          weekday
        }}</span>
        <button
          v-for="date in days"
          :key="date.format('YYYY-MM-DD')"
          type="button"
          :disabled="isDisabled(date)"
          :aria-label="date.format('dddd, MMMM D, YYYY')"
          :aria-selected="date.format('YYYY-MM-DD') === model"
          :class="{
            'date-picker__outside': date.month() !== visibleMonth.month(),
            'date-picker__today': date.isSame(dayjs(), 'day'),
          }"
          @click="selectDate(date)"
        >
          {{ date.date() }}
        </button>
      </div>
      <div class="date-picker__calendar-footer">
        <button type="button" @click="clearDate">Clear</button>
        <button type="button" :disabled="isDisabled(dayjs())" @click="selectDate(dayjs())">
          Today
        </button>
      </div>
    </div>
    <p v-if="hint" :id="hintId" class="date-picker__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="date-picker__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.date-picker {
  position: relative;
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
.date-picker__trigger {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.date-picker__trigger:hover:not(:disabled) {
  border-color: var(--color-control-hover);
}
.date-picker__trigger:focus-visible {
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px rgb(47 111 237 / 16%);
  outline: none;
}
.date-picker__trigger:disabled {
  background: var(--color-surface-soft);
  cursor: not-allowed;
  opacity: 0.75;
}
.date-picker__trigger svg,
.date-picker__clear svg {
  width: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}
.date-picker__placeholder {
  color: var(--color-text-muted);
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
.date-picker__calendar {
  position: absolute;
  z-index: 30;
  top: calc(100% - 2.25rem);
  left: 0;
  width: min(20rem, calc(100vw - 2rem));
  padding: var(--space-3);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 16px 40px var(--color-shadow);
}
.date-picker__calendar-header {
  display: grid;
  grid-template-columns: 2.75rem 1fr 2.75rem;
  align-items: center;
  margin-bottom: var(--space-2);
  text-align: center;
}
.date-picker__calendar-header button,
.date-picker__calendar-footer button {
  min-height: 2.75rem;
  color: var(--color-text);
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.date-picker__calendar-header button {
  font-size: 1.5rem;
}
.date-picker__calendar-header button:hover,
.date-picker__calendar-footer button:hover {
  background: var(--color-surface-soft);
}
.date-picker__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.date-picker__weekday {
  display: grid;
  min-height: 2rem;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  font-weight: 700;
  place-items: center;
}
.date-picker__grid button {
  min-width: 0;
  min-height: 2.5rem;
  padding: 0;
  color: var(--color-text);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.date-picker__grid button:hover:not(:disabled) {
  background: var(--color-surface-soft);
}
.date-picker__grid button[aria-selected='true'] {
  color: #fff;
  background: var(--color-primary);
  font-weight: 700;
}
.date-picker__outside {
  color: var(--color-text-muted) !important;
  opacity: 0.55;
}
.date-picker__today {
  box-shadow: inset 0 0 0 1px var(--color-primary);
  font-weight: 700;
}
.date-picker__grid button:disabled {
  cursor: not-allowed;
  opacity: 0.28;
}
.date-picker__calendar-footer {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}
.date-picker__calendar-footer button {
  padding: 0 var(--space-3);
  color: var(--color-primary);
  font-weight: 650;
}
.date-picker__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
.date-picker__error {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  color: #b42318;
  font-size: 0.8125rem;
  font-weight: 600;
}
.date-picker--error .date-picker__label {
  color: #b42318;
}
.date-picker--error .date-picker__trigger {
  background: #fffafa;
  border-color: #d83a3a;
}
@media (max-width: 420px) {
  .date-picker__calendar {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
