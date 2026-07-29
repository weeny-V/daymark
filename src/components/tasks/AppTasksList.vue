<template>
  <section class="task-list" aria-labelledby="task-list-title">
    <header class="task-list__header">
      <div>
        <p class="task-list__eyebrow">Your list</p>
        <h2 id="task-list-title">Tasks</h2>
      </div>
      <div class="task-list__summary" role="status" aria-live="polite">
        <slot name="summary">0 tasks</slot>
      </div>
    </header>

    <ul class="task-list__items">
      <slot />
    </ul>
  </section>
</template>

<style scoped>
.task-list {
  margin-top: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgb(24 26 32 / 5%);
  overflow: hidden;
}

.task-list__header {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.task-list__eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--color-primary);
  font-size: 0.6875rem;
  font-weight: 750;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: -0.025em;
}

.task-list__summary {
  flex: 0 0 auto;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 650;
}

.task-list__items {
  padding: 0;
  margin: 0;
  list-style: none;
}

.task-list__items :deep(.task-list__empty) {
  display: grid;
  justify-items: center;
  padding: var(--space-8) var(--space-5);
  color: var(--color-text-muted);
  text-align: center;
}

.task-list__items :deep(.task-list__empty-icon) {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  margin-bottom: var(--space-4);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: 50%;
  place-items: center;
}

.task-list__items :deep(.task-list__empty-icon svg) {
  width: 1.65rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.task-list__items :deep(.task-list__empty h3) {
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
}

.task-list__items :deep(.task-list__empty p) {
  max-width: 22rem;
  margin: var(--space-2) 0 0;
  font-size: 0.875rem;
  line-height: 1.6;
}

@media (max-width: 600px) {
  .task-list__header {
    padding-inline: var(--space-4);
  }
}
</style>
