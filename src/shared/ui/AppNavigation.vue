<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppNavigationIcon from './AppNavigationIcon.vue'

const destinations = [
  { label: 'Today', to: '/today', icon: 'today' },
  { label: 'Upcoming', to: '/upcoming', icon: 'upcoming' },
  { label: 'Tasks', to: '/tasks', icon: 'tasks' },
  { label: 'Habits', to: '/habits', icon: 'habits' },
  { label: 'Focus', to: '/focus', icon: 'focus' },
  { label: 'Notes', to: '/notes', icon: 'notes' },
  { label: 'Settings', to: '/settings', icon: 'settings' },
] as const

const primaryDestinations = destinations.filter(({ to }) => ['/today', '/tasks', '/habits', '/focus'].includes(to))
const moreDestinations = destinations.filter(({ to }) => ['/upcoming', '/notes', '/settings'].includes(to))
const route = useRoute()
const moreOpen = ref(false)
const moreButton = ref<HTMLButtonElement>()
const moreSheet = ref<HTMLElement>()
const moreIsActive = computed(() => moreDestinations.some(({ to }) => route.path.startsWith(to)))

const openMore = async () => {
  moreOpen.value = true
  await nextTick()
  moreSheet.value?.querySelector<HTMLElement>('a')?.focus()
}
const closeMore = () => {
  moreOpen.value = false
  nextTick(() => moreButton.value?.focus())
}
</script>

<template>
  <nav class="app-navigation" aria-label="Primary navigation">
    <ul class="app-navigation__list app-navigation__list--desktop">
      <li v-for="destination in destinations" :key="destination.to">
        <RouterLink class="nav-link" :to="destination.to">
          <AppNavigationIcon :icon="destination.icon" />
          <span>{{ destination.label }}</span>
        </RouterLink>
      </li>
    </ul>
    <ul class="app-navigation__list app-navigation__list--mobile">
      <li v-for="destination in primaryDestinations" :key="destination.to">
        <RouterLink class="nav-link" :to="destination.to"><AppNavigationIcon :icon="destination.icon" /><span>{{ destination.label }}</span></RouterLink>
      </li>
      <li><button ref="moreButton" class="nav-link nav-link--button" :class="{ 'nav-link--active': moreIsActive }" type="button" aria-haspopup="dialog" :aria-expanded="moreOpen" aria-controls="mobile-more-sheet" @click="openMore"><AppNavigationIcon icon="more" /><span>More</span></button></li>
    </ul>
    <button v-if="moreOpen" class="more-backdrop" type="button" aria-label="Close more navigation" @click="closeMore" />
    <section v-if="moreOpen" id="mobile-more-sheet" ref="moreSheet" class="more-sheet" role="dialog" aria-modal="true" aria-labelledby="more-sheet-title" @keydown.esc="closeMore">
      <header><div><p>Navigation</p><h2 id="more-sheet-title">More</h2></div><button type="button" aria-label="Close more navigation" @click="closeMore">×</button></header>
      <ul><li v-for="destination in moreDestinations" :key="destination.to"><RouterLink class="more-link" :to="destination.to" @click="closeMore"><AppNavigationIcon :icon="destination.icon" /><span>{{ destination.label }}</span><span aria-hidden="true">›</span></RouterLink></li></ul>
    </section>
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

.app-navigation__list--mobile {
  display: none;
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

.nav-link--button {
  width: 100%;
  border: 0;
  cursor: pointer;
}

.nav-link--active {
  color: var(--color-primary);
  background: var(--color-primary-soft);
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

  .app-navigation__list--desktop {
    display: none;
  }

  .app-navigation__list--mobile {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
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

  .more-backdrop {
    position: fixed;
    z-index: 40;
    inset: 0;
    padding: 0;
    background: rgb(17 19 26 / 45%);
    border: 0;
    backdrop-filter: blur(2px);
  }

  .more-sheet {
    position: fixed;
    z-index: 41;
    right: 0;
    bottom: 0;
    left: 0;
    padding: var(--space-5) var(--space-4)
      calc(var(--space-5) + env(safe-area-inset-bottom));
    color: var(--color-text);
    background: var(--color-surface);
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    box-shadow: 0 -16px 40px rgb(17 19 26 / 18%);
  }

  .more-sheet header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .more-sheet header p,
  .more-sheet h2 {
    margin: 0;
  }

  .more-sheet header p {
    color: var(--color-primary);
    font-size: 0.6875rem;
    font-weight: 750;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .more-sheet h2 {
    margin-top: var(--space-1);
    font-size: 1.25rem;
  }

  .more-sheet header button {
    display: grid;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    color: var(--color-text-muted);
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.5rem;
    place-items: center;
  }

  .more-sheet ul {
    display: grid;
    gap: var(--space-2);
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .more-link {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--space-3);
    align-items: center;
    min-height: 3.5rem;
    padding: var(--space-3) var(--space-4);
    color: var(--color-text);
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-weight: 650;
    text-decoration: none;
  }

  .more-link.router-link-active {
    color: var(--color-primary);
    background: var(--color-primary-soft);
    border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
  }
}
</style>
