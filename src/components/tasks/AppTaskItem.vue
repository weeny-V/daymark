<script setup lang="ts">
import type { Task } from '@/types/Task.js'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { formatDate } from '@/shared/utils/date'
import { useOrganizationStore } from '@/stores/organization'
import { useTasksStore } from '@/stores/tasks'
import { ref } from 'vue'
import AppDialog from '@/shared/ui/AppDialog.vue'

const props = withDefaults(
  defineProps<{
    task: Task
    manageSubtasks?: boolean
    canMoveUp?: boolean
    canMoveDown?: boolean
  }>(),
  { manageSubtasks: false, canMoveUp: false, canMoveDown: false },
)

defineEmits<{
  delete: [id: string]
  edit: [id: string]
  toggle: [id: string]
  move: [id: string, direction: 'up' | 'down']
}>()

const { dateFormat } = storeToRefs(useSettingsStore())
const organization = useOrganizationStore()
const tasksStore = useTasksStore()
const newSubtaskTitle = ref('')
const editDialogOpen = ref(false)
const editingSubtask = ref<{ id: string; title: string }>()
const editError = ref('')
const incompleteSubtasks = () =>
  props.task.subtasks?.filter((subtask) => !subtask.completed).length ?? 0
const addSubtask = () => {
  if (tasksStore.addSubtask(props.task.id, newSubtaskTitle.value)) newSubtaskTitle.value = ''
}
const openSubtaskEditor = (id: string, title: string) => {
  editingSubtask.value = { id, title }
  editError.value = ''
  editDialogOpen.value = true
}
const saveSubtask = () => {
  if (!editingSubtask.value) return
  if (
    !tasksStore.updateSubtask(props.task.id, editingSubtask.value.id, editingSubtask.value.title)
  ) {
    editError.value = 'Subtask title cannot be empty.'
    return
  }
  editDialogOpen.value = false
}

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
        :disabled="!task.completed && incompleteSubtasks() > 0"
        :aria-describedby="incompleteSubtasks() > 0 ? `task-${task.id}-completion-rule` : undefined"
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
        <span v-if="task.projectId"
          >Project
          {{
            organization.projects.find((item) => item.id === task.projectId)?.name ?? 'Deleted'
          }}</span
        >
        <span v-for="tagId in task.tagIds" :key="tagId"
          >Tag {{ organization.tags.find((item) => item.id === tagId)?.name ?? 'Deleted' }}</span
        >
        <span v-if="task.dueTo" class="task-item__due-date">
          Due
          <time :datetime="task.dueTo">{{ formatDate(task.dueTo, dateFormat) }}</time>
        </span>
        <span class="task-item__created">
          Created
          <time :datetime="task.createdAt">{{ formatDate(task.createdAt, dateFormat) }}</time>
        </span>
      </p>
      <p
        v-if="incompleteSubtasks() > 0"
        :id="`task-${task.id}-completion-rule`"
        class="task-item__rule"
      >
        Complete all {{ incompleteSubtasks() }} active subtasks before completing this task.
      </p>

      <section
        v-if="manageSubtasks"
        class="subtasks"
        :aria-labelledby="`task-${task.id}-subtasks-title`"
      >
        <h3 :id="`task-${task.id}-subtasks-title`">Subtasks</h3>
        <form class="subtasks__add" @submit.prevent="addSubtask">
          <label :for="`task-${task.id}-new-subtask`">Add a subtask</label>
          <div>
            <input :id="`task-${task.id}-new-subtask`" v-model="newSubtaskTitle" />
            <button type="submit">Add</button>
          </div>
        </form>
        <ol v-if="task.subtasks?.length">
          <li
            v-for="(subtask, index) in [...task.subtasks].sort((a, b) => a.order - b.order)"
            :key="subtask.id"
            class="subtask-item"
            :class="{ 'subtask-item--completed': subtask.completed }"
          >
            <label class="subtask-item__check-target">
              <input
                type="checkbox"
                :checked="subtask.completed"
                :aria-label="`Mark ${subtask.title} as ${subtask.completed ? 'active' : 'complete'}`"
                @change="tasksStore.toggleSubtask(task.id, subtask.id)"
              />
            </label>
            <div class="subtask-item__content">
              <span class="subtask-item__title">{{ subtask.title }}</span>
              <span class="subtask-item__status">{{
                subtask.completed ? 'Completed' : 'Active'
              }}</span>
            </div>
            <div class="subtask-item__actions">
              <button
                type="button"
                :aria-label="`Edit ${subtask.title}`"
                title="Edit"
                @click="openSubtaskEditor(subtask.id, subtask.title)"
              >
                Edit
              </button>
              <button
                type="button"
                :disabled="index === 0"
                :aria-label="`Move ${subtask.title} up`"
                title="Move up"
                @click="tasksStore.moveSubtask(task.id, subtask.id, 'up')"
              >
                ↑
              </button>
              <button
                type="button"
                :disabled="index === task.subtasks!.length - 1"
                :aria-label="`Move ${subtask.title} down`"
                title="Move down"
                @click="tasksStore.moveSubtask(task.id, subtask.id, 'down')"
              >
                ↓
              </button>
              <button
                class="subtask-item__delete"
                type="button"
                :aria-label="`Delete ${subtask.title}`"
                title="Delete"
                @click="tasksStore.deleteSubtask(task.id, subtask.id)"
              >
                ×
              </button>
            </div>
          </li>
        </ol>
        <p v-else class="subtasks__empty">No subtasks yet.</p>

        <AppDialog
          v-if="editDialogOpen"
          v-model:open="editDialogOpen"
          title="Edit subtask"
          description="Update the subtask title, then save your changes."
        >
          <form
            v-if="editingSubtask"
            id="subtask-edit-form"
            class="subtask-edit-form"
            @submit.prevent="saveSubtask"
          >
            <label for="subtask-edit-title">Subtask title</label>
            <input
              id="subtask-edit-title"
              v-model="editingSubtask.title"
              :aria-invalid="!!editError"
              :aria-describedby="editError ? 'subtask-edit-error' : undefined"
            />
            <p v-if="editError" id="subtask-edit-error" role="alert">{{ editError }}</p>
          </form>
          <template #footer>
            <button
              class="dialog-button dialog-button--secondary"
              type="button"
              @click="editDialogOpen = false"
            >
              Cancel
            </button>
            <button
              class="dialog-button dialog-button--primary"
              type="submit"
              form="subtask-edit-form"
            >
              Save changes
            </button>
          </template>
        </AppDialog>
      </section>
    </div>

    <div class="task-item__actions">
      <button
        v-if="manageSubtasks"
        class="task-item__action"
        type="button"
        :disabled="!canMoveUp"
        :aria-label="`Move ${task.title} up`"
        @click="$emit('move', task.id, 'up')"
      >
        ↑
      </button>
      <button
        v-if="manageSubtasks"
        class="task-item__action"
        type="button"
        :disabled="!canMoveDown"
        :aria-label="`Move ${task.title} down`"
        @click="$emit('move', task.id, 'down')"
      >
        ↓
      </button>
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

.task-item__rule {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.subtasks {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}
.subtasks h3 {
  margin: 0;
  font-size: 0.875rem;
}
.subtasks__add {
  margin-top: var(--space-2);
}
.subtasks__add label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: 0.75rem;
  font-weight: 700;
}
.subtasks__add div {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
}
.subtasks__add input {
  min-width: 0;
  min-height: 2.75rem;
  padding: var(--space-2);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  font: inherit;
}
.subtasks__add button {
  min-width: 2.75rem;
  min-height: 2.75rem;
  color: var(--color-primary);
  background: transparent;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.subtasks ol {
  display: grid;
  padding: 0;
  margin: var(--space-3) 0 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  list-style: none;
  overflow: hidden;
}
.subtask-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-2);
  align-items: center;
  min-height: 4rem;
  padding: var(--space-2) var(--space-3);
  transition: background-color 160ms ease;
}
.subtask-item + .subtask-item {
  border-top: 1px solid var(--color-border);
}
.subtask-item:hover {
  background: var(--color-surface-soft);
}
.subtask-item__check-target {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  cursor: pointer;
  place-items: center;
}
.subtask-item__check-target input {
  width: 1.125rem;
  height: 1.125rem;
  margin: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
}
.subtask-item__content {
  display: flex;
  min-width: 0;
  gap: var(--space-2);
  align-items: center;
}
.subtask-item__title {
  display: block;
  width: 100%;
  min-width: 0;
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 650;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.subtask-item__status {
  flex: 0 0 auto;
  padding: 0.125rem var(--space-2);
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
}
.subtask-item--completed .subtask-item__title {
  color: var(--color-text-muted);
  text-decoration: line-through;
}
.subtask-item__actions {
  display: flex;
  gap: var(--space-1);
}
.subtask-item__actions button {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  place-items: center;
}
.subtask-item__actions button:hover:not(:disabled) {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}
.subtask-item__actions .subtask-item__delete:hover:not(:disabled) {
  color: #b42318;
  background: #fff0ef;
}
.subtask-item__actions button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--color-focus) 35%, transparent);
  outline-offset: 1px;
}
.subtask-item__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
.subtask-item,
.subtask-item__actions button {
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease;
}
.subtask-edit-form {
  display: grid;
  gap: var(--space-2);
}
.subtask-edit-form label {
  font-size: 0.875rem;
  font-weight: 700;
}
.subtask-edit-form input {
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  font: inherit;
}
.subtask-edit-form input:hover {
  border-color: var(--color-control-hover);
}
.subtask-edit-form input:focus {
  border-color: var(--color-primary);
  outline: 3px solid color-mix(in srgb, var(--color-focus) 30%, transparent);
  outline-offset: 1px;
}
.subtask-edit-form p {
  margin: 0;
  color: #b42318;
  font-size: 0.8125rem;
}
.dialog-button {
  min-height: 2.75rem;
  padding: var(--space-3) var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 2px rgb(24 26 32 / 8%);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
}
.dialog-button--secondary {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: var(--color-control-border);
}
.dialog-button--secondary:hover {
  background: var(--color-surface-soft);
  border-color: var(--color-control-hover);
}
.dialog-button--primary {
  color: #fff;
  background: var(--color-primary);
  box-shadow: 0 2px 6px rgb(101 88 211 / 24%);
}
.dialog-button--primary:hover {
  background: #574bc3;
  box-shadow: 0 4px 12px rgb(101 88 211 / 28%);
}
.dialog-button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--color-focus) 35%, transparent);
  outline-offset: 2px;
}
.subtask-item--completed {
  background: color-mix(in srgb, var(--color-surface-soft) 45%, transparent);
}
.subtasks__empty {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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

.task-item__action:disabled,
.subtasks__add button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
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

  .subtask-item {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .subtask-item__actions {
    grid-column: 2;
    flex-wrap: wrap;
  }
  .subtask-item__content {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .task-item {
    transition: none;
  }
}
</style>
