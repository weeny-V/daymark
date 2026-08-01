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
  white-space: nowrap;
}

h2 {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: -0.025em;
}

.task-list__summary {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: flex-end;
}

.task-list__summary :deep(.task-summary-chip) {
  display: inline-flex;
  min-height: 2rem;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-1) var(--space-3);
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
}

.task-list__summary :deep(.task-summary-chip strong) {
  display: grid;
  min-width: 1.25rem;
  min-height: 1.25rem;
  padding-inline: var(--space-1);
  color: var(--color-text);
  background: var(--color-surface);
  border-radius: 999px;
  font-size: 0.75rem;
  place-items: center;
}

.task-list__summary :deep(.task-summary-chip--active) {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
}

.task-list__summary :deep(.task-summary-chip--completed) {
  color: #287a52;
  background: color-mix(in srgb, #3ca878 12%, var(--color-surface));
  border-color: color-mix(in srgb, #3ca878 30%, var(--color-border));
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
    align-items: stretch;
    flex-direction: column;
    padding: var(--space-4);
  }

  .task-list__summary {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .task-list__summary :deep(.task-summary-chip) {
    min-width: 0;
    justify-content: center;
    padding-inline: var(--space-2);
    text-transform: none;
  }

  .task-list__summary :deep(.task-summary-chip strong) {
    flex: 0 0 auto;
  }
}

@media (max-width: 380px) {
  .task-list__header {
    padding-inline: var(--space-3);
  }

  .task-list__summary {
    gap: var(--space-1);
  }

  .task-list__summary :deep(.task-summary-chip) {
    gap: var(--space-1);
    padding-inline: var(--space-1);
    font-size: 0.625rem;
  }
}
</style>
