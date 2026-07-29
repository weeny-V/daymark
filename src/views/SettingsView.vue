<template>
  <section class="placeholder-view">
    <p class="eyebrow">Your workspace</p>
    <h1>Settings</h1>
    <p>
      Workspace preferences are coming soon. This page will collect appearance,
      planning, notification, and local-data controls in one predictable place.
    </p>
  </section>
</template>

<style scoped>
.placeholder-view {
  max-width: 40rem;
}

.eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
}

p:last-child {
  margin: var(--space-4) 0 0;
  color: var(--color-text-muted);
  font-size: 1.0625rem;
  line-height: 1.65;
}
</style>
