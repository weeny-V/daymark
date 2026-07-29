<script setup lang="ts">
import {computed} from "vue";
import type {Task, TaskFilter} from "@/types/Task.js";

const { selectedFilter, tasks } = defineProps<{
  tasks: Task[]
  selectedFilter: TaskFilter
}>()

const emptyStateTitle = computed(() => {
  if (selectedFilter === 'active') return 'No active tasks'
  if (selectedFilter === 'completed') return 'No completed tasks'
  return 'No tasks yet'
})

const emptyStateMessage = computed(() => {
  if (selectedFilter === 'active') {
    return 'Everything is complete. Add a new task when you are ready.'
  }

  if (selectedFilter === 'completed') {
    return 'Complete a task and it will appear here.'
  }

  return 'Add your first task above to start building your list.'
})
</script>

<template>
  <li
    v-if="tasks.length === 0"
    class="task-list__empty"
    role="status"
    aria-live="polite"
  >
        <span class="task-list__empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" />
          </svg>
        </span>
    <h3>{{ emptyStateTitle }}</h3>
    <p>{{ emptyStateMessage }}</p>
  </li>
</template>

<style scoped>

</style>
