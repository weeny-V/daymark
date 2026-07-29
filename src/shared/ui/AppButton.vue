<template>
  <button class="app-button" type="button">
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: var(--space-3) var(--space-5);
  color: #fff;
  background: var(--color-primary);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 2px rgb(24 26 32 / 12%);
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.app-button:hover:not(:disabled) {
  background: #574bc3;
  box-shadow: 0 4px 12px rgb(101 88 211 / 24%);
}

.app-button:active:not(:disabled) {
  box-shadow: 0 1px 3px rgb(101 88 211 / 20%);
  transform: translateY(1px);
}

.app-button:disabled {
  color: #8b8f9b;
  background: #e3e5eb;
  box-shadow: none;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .app-button {
    transition: none;
  }
}
</style>
