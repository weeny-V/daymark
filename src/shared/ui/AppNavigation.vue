<script setup lang="ts">
const destinations = [
  { label: 'Today', to: '/today', icon: 'today' },
  { label: 'Tasks', to: '/tasks', icon: 'tasks' },
  { label: 'Notes', to: '/notes', icon: 'notes' },
  { label: 'Settings', to: '/settings', icon: 'settings' },
] as const
</script>

<template>
  <nav class="app-navigation" aria-label="Primary navigation">
    <ul class="app-navigation__list">
      <li v-for="destination in destinations" :key="destination.to">
        <RouterLink class="nav-link" :to="destination.to">
          <svg v-if="destination.icon === 'today'" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5h14v15H5zM8 3v4M16 3v4M5 9h14" />
          </svg>
          <svg v-else-if="destination.icon === 'tasks'" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
          </svg>
          <svg v-else-if="destination.icon === 'notes'" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.38.32.73.6 1 .3.28.7.42 1.1.4h.1v4h-.1c-.4-.02-.8.12-1.1.4-.28.27-.5.62-.6 1Z"
            />
          </svg>
          <span>{{ destination.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.app-navigation {
  position: sticky;
  top: var(--header-height);
  height: calc(100vh - var(--header-height));
  padding: var(--space-5) var(--space-4);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}

.app-navigation__list {
  display: grid;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
  list-style: none;
}

.nav-link {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  min-height: 3rem;
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
}

.nav-link:hover {
  color: var(--color-text);
  background: var(--color-surface-soft);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.nav-link svg {
  flex: 0 0 auto;
  width: 1.35rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

@media (max-width: 767px) {
  .app-navigation {
    position: fixed;
    z-index: 30;
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    height: auto;
    padding: var(--space-2) max(var(--space-2), env(safe-area-inset-right))
      calc(var(--space-2) + env(safe-area-inset-bottom))
      max(var(--space-2), env(safe-area-inset-left));
    border-top: 1px solid var(--color-border);
    border-right: 0;
  }

  .app-navigation__list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-1);
  }

  .nav-link {
    flex-direction: column;
    gap: var(--space-1);
    justify-content: center;
    min-height: 3.75rem;
    padding: var(--space-2) var(--space-1);
    font-size: 0.6875rem;
  }
}
</style>
