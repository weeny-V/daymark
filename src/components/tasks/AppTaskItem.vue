<script setup lang="ts">
import type { Task } from '@/types/Task.js'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { formatDate } from '@/shared/utils/date'

defineProps<{
  task: Task
}>()

defineEmits<{
  delete: [id: string]
  edit: [id: string]
  toggle: [id: string]
}>()

const { dateFormat } = storeToRefs(useSettingsStore())

const priorityLabels = {
  low: 'Low priority',
  medium: 'Medium priority',
  high: 'High priority',
} as const
</script>

<template>
  <li :id="`task-${task.id}`" class="task-item" :class="{ 'task-item--completed': task.completed }">
    <label class="task-item__check-target">
      <input
        class="task-item__checkbox"
        type="checkbox"
        :checked="task.completed"
        :aria-label="`Mark ${task.title} as ${task.completed ? 'active' : 'complete'}`"
        @change="$emit('toggle', task.id)"
      />
    </label>

    <div class="task-item__content">
      <p class="task-item__title">
        {{ task.title }}
        <span class="task-item__status">{{ task.completed ? 'Completed' : 'Active' }}</span>
      </p>
      <p class="task-item__meta">
        <span v-if="task.priority" class="task-item__priority">
          {{ priorityLabels[task.priority] }}
        </span>
        <span v-if="task.dueTo" class="task-item__due-date">
          Due
          <time :datetime="task.dueTo">{{ formatDate(task.dueTo, dateFormat) }}</time>
        </span>
        <span class="task-item__created">
          Created
          <time :datetime="task.createdAt">{{ formatDate(task.createdAt, dateFormat) }}</time>
        </span>
      </p>
    </div>

    <div class="task-item__actions">
      <button
        class="task-item__action task-item__edit"
        type="button"
        :aria-label="`Edit ${task.title}`"
        @click="$emit('edit', task.id)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20ZM14.5 6.7l2.8 2.8" />
        </svg>
      </button>

      <button
        class="task-item__action task-item__delete"
        type="button"
        :aria-label="`Delete ${task.title}`"
        @click="$emit('delete', task.id)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
        </svg>
      </button>
    </div>
  </li>
</template>

<style scoped>
.task-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
  min-height: 4.5rem;
  padding: var(--space-4) var(--space-5);
  transition: background-color 160ms ease;
}

.task-item + .task-item {
  border-top: 1px solid var(--color-border);
}

.task-item:hover {
  background: var(--color-surface-soft);
}

.task-item__check-target {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  cursor: pointer;
  place-items: center;
}

.task-item__checkbox {
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.task-item__status {
  display: inline-block;
  padding: 0.125rem var(--space-2);
  margin-left: var(--space-2);
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1.4;
  text-decoration: none;
  vertical-align: 0.08em;
}

.task-item__content {
  min-width: 0;
}

.task-item__title {
  margin: 0;
  color: var(--color-text);
  font-size: 0.9375rem;
  font-weight: 650;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.task-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.4;
}

.task-item__priority {
  font-weight: 700;
}

.task-item__meta > * {
  display: inline-flex;
  gap: var(--space-1);
  align-items: baseline;
}

.task-item__meta > * + *::before {
  margin-right: var(--space-1);
  content: '·';
}

.task-item__due-date {
  color: var(--color-primary);
  font-weight: 700;
}

.task-item--completed .task-item__title {
  color: var(--color-text-muted);
  text-decoration: line-through;
}

.task-item__actions {
  display: flex;
  gap: var(--space-1);
}

.task-item__action {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  place-items: center;
}

.task-item__edit:hover {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.task-item__delete:hover {
  color: #b42318;
  background: #fff0ef;
}

.task-item__action svg {
  width: 1.2rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

@media (max-width: 600px) {
  .task-item {
    gap: var(--space-2);
    padding-inline: var(--space-4);
  }

  .task-item__actions {
    gap: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .task-item {
    transition: none;
  }
}
</style>
