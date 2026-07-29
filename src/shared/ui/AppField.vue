<template>
  <div class="app-field">
    <label class="app-field__label">
      <span class="app-field__label-text">
        <slot name="label" />
      </span>
      <span class="app-field__control">
        <slot />
      </span>
    </label>
    <div class="app-field__message">
      <slot name="message" />
    </div>
  </div>
</template>

<style scoped>
.app-field {
  display: grid;
  gap: var(--space-2);
}

.app-field__label {
  display: grid;
  gap: var(--space-2);
}

.app-field__label-text {
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 650;
  line-height: 1.4;
}

.app-field__label-text:empty,
.app-field__message:empty {
  display: none;
}

.app-field__control {
  display: block;
}

.app-field__control :deep(input),
.app-field__control :deep(textarea),
.app-field__control :deep(select) {
  width: 100%;
  min-height: 2.75rem;
  padding: var(--space-3) var(--space-4);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid #cfd2dc;
  border-radius: var(--radius-sm);
  outline: none;
  font: inherit;
  line-height: 1.4;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.app-field__control :deep(textarea) {
  min-height: 7rem;
  resize: vertical;
}

.app-field__control :deep(input::placeholder),
.app-field__control :deep(textarea::placeholder) {
  color: #858a97;
}

.app-field__control :deep(input:hover),
.app-field__control :deep(textarea:hover),
.app-field__control :deep(select:hover) {
  border-color: #aeb2bf;
}

.app-field__control :deep(input:focus-visible),
.app-field__control :deep(textarea:focus-visible),
.app-field__control :deep(select:focus-visible) {
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px rgb(47 111 237 / 16%);
}

.app-field__control :deep(input:disabled),
.app-field__control :deep(textarea:disabled),
.app-field__control :deep(select:disabled) {
  color: #8b8f9b;
  background: #f0f1f4;
  cursor: not-allowed;
}

.app-field__control :deep([aria-invalid='true']) {
  background: #fffafa;
  border-color: #d83a3a;
}

.app-field__control :deep([aria-invalid='true']:focus-visible) {
  border-color: #b42318;
  box-shadow: 0 0 0 3px rgb(216 58 58 / 14%);
}

.app-field__message {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.app-field:has([aria-invalid='true']) .app-field__message {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  color: #b42318;
  font-weight: 600;
}

.app-field:has([aria-invalid='true']) .app-field__label-text {
  color: #b42318;
}

.app-field:has([aria-invalid='true']) .app-field__message::before {
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
  .app-field__control :deep(input),
  .app-field__control :deep(textarea),
  .app-field__control :deep(select) {
    transition: none;
  }
}
</style>
