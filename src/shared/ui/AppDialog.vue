<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    closeLabel?: string
    dismissible?: boolean
  }>(),
  {
    description: '',
    closeLabel: 'Close dialog',
    dismissible: true,
  },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  dismiss: [reason: 'button' | 'escape']
}>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const closing = ref(false)
let closeTimer: number | undefined
const generatedId = useId()
const titleId = `dialog-${generatedId}-title`
const descriptionId = computed(() =>
  props.description ? `dialog-${generatedId}-description` : undefined,
)

const syncOpenState = () => {
  const element = dialog.value
  if (!element) return

  if (open.value && !element.open) {
    window.clearTimeout(closeTimer)
    closing.value = false
    if (typeof element.showModal === 'function') {
      element.showModal()
    } else {
      element.setAttribute('open', '')
    }
  } else if (open.value && closing.value) {
    window.clearTimeout(closeTimer)
    closing.value = false
  } else if (!open.value && element.open && !closing.value) {
    const closeElement = () => {
      closing.value = false
      if (typeof element.close === 'function') element.close()
      else element.removeAttribute('open')
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      closeElement()
    } else {
      closing.value = true
      closeTimer = window.setTimeout(closeElement, 220)
    }
  }
}

const dismiss = (reason: 'button' | 'escape') => {
  if (!props.dismissible) return

  emit('dismiss', reason)
  open.value = false
}

const handleCancel = (event: Event) => {
  event.preventDefault()
  dismiss('escape')
}

const handleNativeClose = () => {
  if (open.value) open.value = false
}

watch(open, syncOpenState, { flush: 'post' })
onMounted(syncOpenState)
onBeforeUnmount(() => window.clearTimeout(closeTimer))
</script>

<template>
  <dialog
    ref="dialog"
    class="app-dialog"
    :class="{ 'app-dialog--closing': closing }"
    :aria-labelledby="titleId"
    :aria-describedby="descriptionId"
    @cancel="handleCancel"
    @close="handleNativeClose"
  >
    <div class="app-dialog__surface">
      <header class="app-dialog__header">
        <div>
          <h2 :id="titleId">
            <slot name="title">{{ title }}</slot>
          </h2>
          <p v-if="description" :id="descriptionId">
            {{ description }}
          </p>
        </div>

        <button
          v-if="dismissible"
          class="app-dialog__close"
          type="button"
          :aria-label="closeLabel"
          @click="dismiss('button')"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
        </button>
      </header>

      <div class="app-dialog__body">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="app-dialog__footer">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.app-dialog {
  width: min(32rem, calc(100% - 2rem));
  max-height: min(42rem, calc(100dvh - 2rem));
  padding: 0;
  color: var(--color-text);
  background: transparent;
  border: 0;
  overflow: visible;
}

.app-dialog::backdrop {
  background: rgb(15 17 24 / 58%);
  backdrop-filter: blur(2px);
  animation: app-dialog-backdrop-in 200ms ease-out both;
}

.app-dialog__surface {
  max-height: min(42rem, calc(100dvh - 2rem));
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 24px 64px rgb(15 17 24 / 28%);
  overflow: auto;
  animation: app-dialog-surface-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  transform-origin: 50% 45%;
}

.app-dialog--closing::backdrop {
  animation: app-dialog-backdrop-out 200ms ease-in both;
}

.app-dialog--closing .app-dialog__surface {
  animation: app-dialog-surface-out 200ms ease-in both;
}

@keyframes app-dialog-backdrop-in {
  from { opacity: 0; }
}

@keyframes app-dialog-backdrop-out {
  to { opacity: 0; }
}

@keyframes app-dialog-surface-in {
  from {
    opacity: 0;
    transform: translateY(0.75rem) scale(0.97);
  }
}

@keyframes app-dialog-surface-out {
  to {
    opacity: 0;
    transform: translateY(0.5rem) scale(0.98);
  }
}

.app-dialog__header {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.app-dialog__header h2 {
  margin: 0;
  font-size: 1.375rem;
  letter-spacing: -0.025em;
  line-height: 1.25;
}

.app-dialog__header p {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
}

.app-dialog__close {
  display: grid;
  flex: 0 0 auto;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  place-items: center;
}

.app-dialog__close:hover {
  color: var(--color-text);
  background: var(--color-surface-soft);
  border-color: var(--color-border);
}

.app-dialog__close svg {
  width: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.8;
}

.app-dialog__body {
  padding: var(--space-5);
}

.app-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: flex-end;
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface-soft);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 480px) {
  .app-dialog {
    width: calc(100% - 1rem);
    max-height: calc(100dvh - 1rem);
  }

  .app-dialog__surface {
    max-height: calc(100dvh - 1rem);
  }

  .app-dialog__header,
  .app-dialog__body {
    padding: var(--space-4);
  }

  .app-dialog__footer {
    display: grid;
    grid-template-columns: 1fr;
    padding: var(--space-4);
  }

  .app-dialog__footer :deep(button) {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-dialog::backdrop {
    backdrop-filter: none;
  }

  .app-dialog__surface,
  .app-dialog--closing .app-dialog__surface,
  .app-dialog::backdrop,
  .app-dialog--closing::backdrop {
    animation: none;
  }
}
</style>
