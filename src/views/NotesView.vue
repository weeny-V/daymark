<template>
  <section class="placeholder-view">
    <p class="eyebrow">Ideas and references</p>
    <h1>Notes</h1>
    <p>
      A focused writing space is coming next. You will be able to capture ideas,
      organize references, and turn useful notes into tasks.
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
