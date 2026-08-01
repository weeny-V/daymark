<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId } from 'vue'

export interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{ options: SelectOption[]; name?: string; disabled?: boolean; ariaLabel?: string }>(),
  { name: undefined, disabled: false, ariaLabel: undefined },
)

const model = defineModel<string>({ required: true })
const open = ref(false)
const activeIndex = ref(0)
const root = ref<HTMLElement>()
const listId = `select-list-${useId()}`
const selected = computed(() => props.options.find((option) => option.value === model.value))

const close = () => {
  open.value = false
  document.removeEventListener('pointerdown', onOutsideClick)
}
const onOutsideClick = (event: PointerEvent) => {
  if (!root.value?.contains(event.target as Node)) close()
}

const show = async () => {
  if (props.disabled) return
  activeIndex.value = Math.max(
    0,
    props.options.findIndex((option) => option.value === model.value),
  )
  open.value = true
  document.addEventListener('pointerdown', onOutsideClick)
  await nextTick()
}

const toggle = () => (open.value ? close() : show())
const choose = (index: number) => {
  const option = props.options[index]
  if (option) model.value = option.value
  close()
}

const onKeydown = (event: KeyboardEvent) => {
  if (!open.value && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
    event.preventDefault()
    void show()
    return
  }
  if (!open.value) return
  if (event.key === 'Escape' || event.key === 'Tab') close()
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    choose(activeIndex.value)
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const direction = event.key === 'ArrowDown' ? 1 : -1
    activeIndex.value =
      (activeIndex.value + direction + props.options.length) % props.options.length
  }
  if (event.key === 'Home') activeIndex.value = 0
  if (event.key === 'End') activeIndex.value = props.options.length - 1
}

onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutsideClick))
</script>

<template>
  <div ref="root" class="select-dropdown">
    <input :name="name" type="hidden" :value="model" />
    <button
      class="select-dropdown__trigger"
      type="button"
      :disabled="disabled"
      :aria-label="ariaLabel"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span>{{ selected?.label }}</span>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
    </button>
    <div v-if="open" :id="listId" class="select-dropdown__menu" role="listbox">
      <button
        v-for="(option, index) in options"
        :key="option.value"
        type="button"
        role="option"
        :aria-selected="option.value === model"
        :class="{ 'select-dropdown__option--active': index === activeIndex }"
        @pointerenter="activeIndex = index"
        @click="choose(index)"
      >
        <span>{{ option.label }}</span>
        <svg v-if="option.value === model" viewBox="0 0 20 20" aria-hidden="true">
          <path d="m4 10 4 4 8-8" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.select-dropdown {
  position: relative;
}
.select-dropdown__trigger {
  display: flex;
  width: 100%;
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
.select-dropdown__trigger:hover:not(:disabled) {
  border-color: var(--color-control-hover);
}
.select-dropdown__trigger:focus-visible {
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px rgb(47 111 237 / 16%);
  outline: none;
}
.select-dropdown__trigger:disabled {
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  cursor: not-allowed;
}
.select-dropdown__trigger svg {
  width: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}
.select-dropdown__menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + var(--space-2));
  left: 0;
  width: 100%;
  padding: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 12px 32px var(--color-shadow);
}
.select-dropdown__menu button {
  display: flex;
  width: 100%;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  background: transparent;
  border: 0;
  border-radius: calc(var(--radius-sm) - 3px);
  cursor: pointer;
  text-align: left;
}
.select-dropdown__menu button:hover,
.select-dropdown__option--active {
  background: var(--color-surface-soft) !important;
}
.select-dropdown__menu button[aria-selected='true'] {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-weight: 650;
}
.select-dropdown__menu svg {
  width: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}
</style>
