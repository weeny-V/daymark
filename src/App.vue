<script setup lang="ts">
import AppHeader from './shared/ui/AppHeader.vue'
import AppNavigation from './shared/ui/AppNavigation.vue'
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <AppHeader />
    <div class="app-shell__body">
      <AppNavigation />
      <main id="main-content" class="app-main" tabindex="-1">
        <div class="app-main__container">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
:root {
  color-scheme: light;
  --color-canvas: #f6f7fb;
  --color-surface: #ffffff;
  --color-surface-soft: #f0f2f7;
  --color-text: #181a20;
  --color-text-muted: #686d7a;
  --color-border: #e2e4ea;
  --color-primary: #6558d3;
  --color-primary-soft: #eeecff;
  --color-focus: #2f6fed;
  --shadow-header: 0 1px 0 rgb(24 26 32 / 8%);
  --radius-sm: 10px;
  --radius-md: 16px;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-8: 3rem;
  --content-max: 72rem;
  --header-height: 4.5rem;
  --nav-width: 15.5rem;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

html {
  min-width: 0;
  background: var(--color-canvas);
}

body {
  min-width: 0;
  min-height: 100vh;
  margin: 0;
  color: var(--color-text);
  background: var(--color-canvas);
}

button,
a {
  font: inherit;
}

a {
  color: inherit;
}

:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.app-shell {
  min-height: 100vh;
}

.skip-link {
  position: fixed;
  z-index: 100;
  top: var(--space-3);
  left: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: #fff;
  background: var(--color-text);
  border-radius: var(--radius-sm);
  font-weight: 700;
  text-decoration: none;
  transform: translateY(calc(-100% - var(--space-5)));
}

.skip-link:focus {
  transform: translateY(0);
}

.app-shell__body {
  display: grid;
  grid-template-columns: var(--nav-width) minmax(0, 1fr);
  min-height: calc(100vh - var(--header-height));
}

.app-main {
  min-width: 0;
  padding: var(--space-8) var(--space-6);
}

.app-main__container {
  width: min(100%, var(--content-max));
  margin-inline: auto;
}

@media (max-width: 767px) {
  :root {
    --header-height: 4rem;
  }

  .app-shell {
    padding-bottom: calc(4.75rem + env(safe-area-inset-bottom));
  }

  .app-shell__body {
    display: block;
    min-height: calc(100vh - var(--header-height) - 4.75rem);
  }

  .app-main {
    padding: var(--space-6) var(--space-4);
  }
}
</style>
