<template>
  <div class="select-field">
    <label class="select-field__label">
      <span class="select-field__label-text">
        <slot name="label" />
      </span>

      <span class="select-field__control">
        <slot />
        <svg class="select-field__chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="m6 8 4 4 4-4" />
        </svg>
      </span>
    </label>

    <div class="select-field__message">
      <slot name="message" />
    </div>
  </div>
</template>

<style scoped>
.select-field {
  display: grid;
  gap: var(--space-2);
}

.select-field__label {
  display: grid;
  gap: var(--space-2);
}

.select-field__label-text {
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 650;
  line-height: 1.4;
}

.select-field__label-text:empty,
.select-field__message:empty {
  display: none;
}

.select-field__control {
  position: relative;
  display: block;
}

.select-field__control :deep(select) {
  width: 100%;
  min-height: 2.75rem;
  padding: var(--space-3) 2.75rem var(--space-3) var(--space-4);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid #cfd2dc;
  border-radius: var(--radius-sm);
  outline: none;
  font: inherit;
  line-height: 1.4;
  cursor: pointer;
  appearance: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.select-field__control :deep(select:hover:not(:disabled)) {
  border-color: #aeb2bf;
}

.select-field__control :deep(select:focus-visible) {
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px rgb(47 111 237 / 16%);
}

.select-field__control :deep(select:disabled) {
  color: #8b8f9b;
  background: #f0f1f4;
  cursor: not-allowed;
}

.select-field__chevron {
  position: absolute;
  top: 50%;
  right: var(--space-4);
  width: 1.125rem;
  color: var(--color-text-muted);
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  pointer-events: none;
  transform: translateY(-50%);
}

.select-field__message {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.select-field:has(select[aria-invalid="true"]) .select-field__label-text,
.select-field:has(select[aria-invalid="true"]) .select-field__message {
  color: #b42318;
}

.select-field:has(select[aria-invalid="true"]) .select-field__control :deep(select) {
  background: #fffafa;
  border-color: #d83a3a;
}

.select-field:has(select[aria-invalid="true"]) .select-field__control :deep(select:focus-visible) {
  border-color: #b42318;
  box-shadow: 0 0 0 3px rgb(216 58 58 / 14%);
}

@media (prefers-reduced-motion: reduce) {
  .select-field__control :deep(select) {
    transition: none;
  }
}
</style>
