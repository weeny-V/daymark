<script setup lang="ts">
defineProps<{ icon: 'today' | 'upcoming' | 'tasks' | 'habits' | 'focus' | 'notes' | 'settings' | 'more' }>()
</script>

<template>
  <svg v-if="icon === 'today'" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v15H5zM8 3v4M16 3v4M5 9h14" /></svg>
  <svg v-else-if="icon === 'tasks'" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></svg>
  <svg v-else-if="icon === 'upcoming'" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v15H5zM8 3v4M16 3v4M5 9h14M9 13h6M9 17h4" /></svg>
  <svg v-else-if="icon === 'notes'" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7" /></svg>
  <svg v-else-if="icon === 'habits'" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 13l4 4 8-10M12 3a9 9 0 1 0 9 9" /></svg>
  <svg v-else-if="icon === 'focus'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 3h6M12 3v2" /></svg>
  <svg v-else-if="icon === 'more'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
  <svg v-else viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.38.32.73.6 1 .3.28.7.42 1.1.4h.1v4h-.1c-.4-.02-.8.12-1.1.4-.28.27-.5.62-.6 1Z" /></svg>
</template>

<style scoped>
svg { flex: 0 0 auto; width: 1.35rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
</style>
