<template>
  <section class="not-found">
    <p class="not-found__eyebrow">404 · Page not found</p>
    <h1>This page is off the map</h1>
    <p class="not-found__description">
      The page may have moved, or the address might be incorrect. Return to your
      Today overview to keep planning.
    </p>
    <RouterLink class="not-found__link" to="/today">Back to Today</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  max-width: 40rem;
}

.not-found__eyebrow {
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
  letter-spacing: -0.045em;
  line-height: 1.08;
}

.not-found__description {
  max-width: 36rem;
  margin: var(--space-4) 0 0;
  color: var(--color-text-muted);
  font-size: 1.0625rem;
  line-height: 1.65;
}

.not-found__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: var(--space-3) var(--space-5);
  margin-top: var(--space-6);
  color: #fff;
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 2px rgb(24 26 32 / 12%);
  font-weight: 700;
  text-decoration: none;
  transition:
    background-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.not-found__link:hover {
  background: #574bc3;
  box-shadow: 0 4px 12px rgb(101 88 211 / 24%);
}

.not-found__link:active {
  box-shadow: 0 1px 3px rgb(101 88 211 / 20%);
  transform: translateY(1px);
}

@media (prefers-reduced-motion: reduce) {
  .not-found__link {
    transition: none;
  }
}
</style>
