<script setup lang="ts">
import type { Task } from '@/types/Task.js'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { formatDate } from '@/shared/utils/date'
import { useOrganizationStore } from '@/stores/organization'
import { useTasksStore } from '@/stores/tasks'
import { onBeforeUnmount, ref } from 'vue'
import AppDialog from '@/shared/ui/AppDialog.vue'

const props = withDefaults(
  defineProps<{
    task: Task
    manageSubtasks?: boolean
    canMoveUp?: boolean
    canMoveDown?: boolean
    completionPending?: boolean
    completionMessage?: string
  }>(),
  {
    manageSubtasks: false,
    canMoveUp: false,
    canMoveDown: false,
    completionPending: false,
    completionMessage: '',
  },
)

const emit = defineEmits<{
  delete: [id: string]
  edit: [id: string]
  toggle: [id: string]
  move: [id: string, direction: 'up' | 'down']
  reorder: [id: string, targetId: string, position: 'before' | 'after']
}>()

const { dateFormat } = storeToRefs(useSettingsStore())
const organization = useOrganizationStore()
const tasksStore = useTasksStore()
const newSubtaskTitle = ref('')
const editDialogOpen = ref(false)
const editingSubtask = ref<{ id: string; title: string }>()
const editError = ref('')
const taskDropPosition = ref<'before' | 'after' | null>(null)
const subtaskDropTarget = ref<{ id: string; position: 'before' | 'after' } | null>(null)
const taskActionsOpen = ref(false)
const taskActionsMenu = ref<HTMLElement>()
let dragPointerY: number | null = null
let autoScrollFrame: number | null = null

const runAutoScroll = () => {
  const edgeSize = 96
  const maxSpeed = 18
  let distance = 0
  if (dragPointerY !== null && dragPointerY < edgeSize) {
    distance = -((edgeSize - dragPointerY) / edgeSize) * maxSpeed
  } else if (dragPointerY !== null && dragPointerY > window.innerHeight - edgeSize) {
    distance = ((dragPointerY - (window.innerHeight - edgeSize)) / edgeSize) * maxSpeed
  }
  if (distance) {
    window.scrollBy(0, distance)
    autoScrollFrame = window.requestAnimationFrame(runAutoScroll)
  } else {
    autoScrollFrame = null
  }
}
const trackDragPointer = (event: DragEvent) => {
  dragPointerY = event.clientY
  const nearEdge = event.clientY < 96 || event.clientY > window.innerHeight - 96
  if (nearEdge && autoScrollFrame === null) {
    autoScrollFrame = window.requestAnimationFrame(runAutoScroll)
  }
}
const startPageAutoScroll = () => {
  document.addEventListener('dragover', trackDragPointer)
}
const stopPageAutoScroll = () => {
  document.removeEventListener('dragover', trackDragPointer)
  dragPointerY = null
  if (autoScrollFrame !== null) window.cancelAnimationFrame(autoScrollFrame)
  autoScrollFrame = null
}
const closeTaskActions = () => {
  taskActionsOpen.value = false
  document.removeEventListener('pointerdown', closeTaskActionsOnOutsideClick)
}
const closeTaskActionsOnOutsideClick = (event: PointerEvent) => {
  if (!taskActionsMenu.value?.contains(event.target as Node)) closeTaskActions()
}
const toggleTaskActions = () => {
  taskActionsOpen.value = !taskActionsOpen.value
  if (taskActionsOpen.value) {
    document.addEventListener('pointerdown', closeTaskActionsOnOutsideClick)
  } else {
    document.removeEventListener('pointerdown', closeTaskActionsOnOutsideClick)
  }
}
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

const recurrenceLabel = (task: Task) => {
  if (task.recurrence?.type === 'daily') return 'Repeats daily'
  if (task.recurrence?.type === 'weekly') return 'Repeats weekly'
  if (task.recurrence?.type === 'weekdays') return 'Repeats on selected weekdays'
}

const setDragPreview = (event: DragEvent, source?: HTMLElement | null) => {
  if (!event.dataTransfer || !source) return
  const preview = source.cloneNode(true) as HTMLElement
  preview.className = 'task-drag-preview'
  Object.assign(preview.style, {
    position: 'fixed',
    top: '-1000px',
    left: '-1000px',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: 'max-content',
    maxWidth: '320px',
    padding: '10px 14px',
    color: '#fff',
    background: 'linear-gradient(135deg, #6558d3 0%, #2f6fed 100%)',
    border: '1px solid rgb(255 255 255 / 35%)',
    borderRadius: '10px',
    boxShadow: '0 12px 28px rgb(47 60 130 / 30%)',
    fontWeight: '700',
    opacity: '0.94',
  })
  preview.querySelectorAll<HTMLElement>('*').forEach((element) => {
    element.style.color = 'inherit'
    element.style.background = 'transparent'
    element.style.textDecoration = 'none'
  })
  document.body.append(preview)
  event.dataTransfer.setDragImage(preview, 20, 20)
  window.setTimeout(() => preview.remove())
}

const startTaskDrag = (event: DragEvent) => {
  startPageAutoScroll()
  event.dataTransfer?.setData('text/task-id', props.task.id)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    const preview = (event.currentTarget as HTMLElement)
      .closest('.task-item')
      ?.querySelector<HTMLElement>('.task-item__title')
    setDragPreview(event, preview)
  }
}
const dropTask = (event: DragEvent) => {
  const sourceId = event.dataTransfer?.getData('text/task-id')
  if (sourceId && taskDropPosition.value) {
    emit('reorder', sourceId, props.task.id, taskDropPosition.value)
  }
  taskDropPosition.value = null
}
const showTaskDropPosition = (event: DragEvent) => {
  if (!event.dataTransfer?.types.includes('text/task-id')) return
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  taskDropPosition.value = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
}
const leaveTaskDropTarget = (event: DragEvent) => {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
    taskDropPosition.value = null
  }
}
const startSubtaskDrag = (event: DragEvent, subtaskId: string) => {
  startPageAutoScroll()
  event.stopPropagation()
  event.dataTransfer?.setData('text/subtask-id', subtaskId)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    const preview = (event.currentTarget as HTMLElement)
      .closest('.subtask-item')
      ?.querySelector<HTMLElement>('.subtask-item__content')
    setDragPreview(event, preview)
  }
}
const dropSubtask = (event: DragEvent, targetId: string) => {
  event.stopPropagation()
  const sourceId = event.dataTransfer?.getData('text/subtask-id')
  const position = subtaskDropTarget.value?.position
  if (sourceId && position) tasksStore.reorderSubtask(props.task.id, sourceId, targetId, position)
  subtaskDropTarget.value = null
}
const showSubtaskDropPosition = (event: DragEvent, targetId: string) => {
  if (!event.dataTransfer?.types.includes('text/subtask-id')) return
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const position = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
  subtaskDropTarget.value = { id: targetId, position }
}
onBeforeUnmount(() => {
  stopPageAutoScroll()
  document.removeEventListener('pointerdown', closeTaskActionsOnOutsideClick)
})
</script>

<template>
  <li
    :id="`task-${task.id}`"
    class="task-item"
    :class="{
      'task-item--completed': task.completed,
      'task-item--manageable': manageSubtasks,
      'task-item--drop-before': taskDropPosition === 'before',
      'task-item--drop-after': taskDropPosition === 'after',
    }"
    @dragover.prevent="showTaskDropPosition"
    @dragleave="leaveTaskDropTarget"
    @drop.prevent="dropTask"
  >
    <button
      v-if="manageSubtasks"
      class="task-item__action task-item__drag"
      type="button"
      draggable="true"
      :aria-label="`Reorder ${task.title}. Use arrow keys to move.`"
      title="Drag to reorder"
      @dragstart="startTaskDrag"
      @dragend="stopPageAutoScroll"
      @keydown.up.prevent="$emit('move', task.id, 'up')"
      @keydown.down.prevent="$emit('move', task.id, 'down')"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M7 4h.01M13 4h.01M7 8h.01M13 8h.01M7 12h.01M13 12h.01M7 16h.01M13 16h.01" />
      </svg>
    </button>

    <label class="task-item__check-target">
      <input
        class="task-item__checkbox"
        type="checkbox"
        :checked="task.completed || completionPending"
        :disabled="completionPending || (!task.completed && incompleteSubtasks() > 0)"
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
        <span v-if="task.recurrence" class="task-item__recurrence">{{
          recurrenceLabel(task)
        }}</span>
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
      <p v-if="completionMessage" class="task-item__completion-feedback" role="status">
        <span aria-hidden="true">
          <svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-8" /></svg>
        </span>
        {{ completionMessage }}
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
            <button type="submit" :aria-label="`Add subtask to ${task.title}`" title="Add subtask">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 4v12M4 10h12" />
              </svg>
            </button>
          </div>
        </form>
        <ol v-if="task.subtasks?.length">
          <li
            v-for="subtask in [...task.subtasks].sort((a, b) => a.order - b.order)"
            :key="subtask.id"
            class="subtask-item"
            :class="{
              'subtask-item--completed': subtask.completed,
              'subtask-item--drop-before':
                subtaskDropTarget?.id === subtask.id && subtaskDropTarget.position === 'before',
              'subtask-item--drop-after':
                subtaskDropTarget?.id === subtask.id && subtaskDropTarget.position === 'after',
            }"
            @dragover.stop.prevent="showSubtaskDropPosition($event, subtask.id)"
            @dragleave.stop="subtaskDropTarget = null"
            @drop.prevent="dropSubtask($event, subtask.id)"
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
                class="subtask-item__drag"
                type="button"
                draggable="true"
                :aria-label="`Reorder ${subtask.title}. Use arrow keys to move.`"
                title="Drag to reorder"
                @dragstart="startSubtaskDrag($event, subtask.id)"
                @dragend="stopPageAutoScroll"
                @keydown.up.prevent="tasksStore.moveSubtask(task.id, subtask.id, 'up')"
                @keydown.down.prevent="tasksStore.moveSubtask(task.id, subtask.id, 'down')"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M7 5h.01M13 5h.01M7 10h.01M13 10h.01M7 15h.01M13 15h.01" />
                </svg>
              </button>
              <button
                class="subtask-item__edit"
                type="button"
                :aria-label="`Edit ${subtask.title}`"
                title="Edit"
                @click="openSubtaskEditor(subtask.id, subtask.title)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20ZM14.5 6.7l2.8 2.8" />
                </svg>
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

    <div ref="taskActionsMenu" class="task-item__actions">
      <button
        class="task-item__action task-item__more"
        type="button"
        :aria-label="`Actions for ${task.title}`"
        aria-haspopup="menu"
        :aria-expanded="taskActionsOpen"
        @click="toggleTaskActions"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 4h.01M10 10h.01M10 16h.01" />
        </svg>
      </button>
      <div v-if="taskActionsOpen" class="task-item__menu" role="menu">
        <button type="button" role="menuitem" @click="closeTaskActions(); $emit('edit', task.id)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20ZM14.5 6.7l2.8 2.8" />
          </svg>
          Edit
        </button>
        <button class="task-item__menu-delete" type="button" role="menuitem" @click="closeTaskActions(); $emit('delete', task.id)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  </li>
</template>

<style scoped>
.task-item {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
  min-height: 4.5rem;
  padding: var(--space-4) var(--space-5);
  transition: background-color 160ms ease;
}

.task-item--drop-before::before,
.task-item--drop-after::after,
.subtask-item--drop-before::before,
.subtask-item--drop-after::after {
  position: absolute;
  z-index: 4;
  right: var(--space-3);
  left: var(--space-3);
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-focus));
  border-radius: 999px;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-focus) 14%, transparent);
  content: '';
  pointer-events: none;
}

.task-item--drop-before::before,
.subtask-item--drop-before::before {
  top: -2px;
}

.task-item--drop-after::after,
.subtask-item--drop-after::after {
  bottom: -2px;
}

.task-item--manageable {
  grid-template-columns: auto auto minmax(0, 1fr);
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

.task-item__title,
.task-item__meta {
  padding-right: 3.25rem;
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
.task-item__completion-feedback {
  position: absolute;
  z-index: 40;
  inset: 0;
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  margin: 0;
  color: #166534;
  background: color-mix(in srgb, #ecfdf3 96%, transparent);
  border: 1px solid #a7e8bc;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 45%);
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
  backdrop-filter: blur(3px);
}
.task-item__completion-feedback span {
  display: grid;
  flex: 0 0 auto;
  width: 2.75rem;
  height: 2.75rem;
  color: #fff;
  background: #238654;
  border-radius: 50%;
  place-items: center;
  animation: completion-check-pop 420ms cubic-bezier(0.2, 0.9, 0.3, 1.25) both;
}
.task-item__completion-feedback svg {
  width: 1.35rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}
.task-item__completion-feedback path {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: completion-check-draw 360ms 180ms ease-out forwards;
}
@keyframes completion-check-pop {
  from {
    opacity: 0;
    transform: scale(0.55);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes completion-check-draw {
  to {
    stroke-dashoffset: 0;
  }
}
:global(:root[data-theme='dark']) .task-item__completion-feedback {
  color: #a7e8bc;
  background: #183b2a;
  border-color: #2d6846;
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
  display: grid;
  min-width: 2.75rem;
  min-height: 2.75rem;
  color: var(--color-primary);
  background: transparent;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  place-items: center;
}
.subtasks__add button svg {
  width: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
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
  position: relative;
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
.subtask-item__actions svg {
  width: 1.2rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.task-item__drag,
.subtask-item__drag {
  cursor: grab;
  touch-action: none;
}

.task-item__drag:active,
.subtask-item__drag:active {
  cursor: grabbing;
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
  position: absolute;
  z-index: 10;
  top: var(--space-3);
  right: var(--space-3);
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

.task-item__more:hover,
.task-item__more[aria-expanded='true'] {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.task-item__menu {
  position: absolute;
  z-index: 20;
  right: 0;
  top: calc(100% + var(--space-2));
  display: grid;
  width: 9rem;
  padding: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 12px 28px var(--color-shadow);
}

.task-item__menu button {
  display: flex;
  min-height: 2.75rem;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  background: transparent;
  border: 0;
  border-radius: calc(var(--radius-sm) - 3px);
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 650;
}

.task-item__menu button:hover,
.task-item__menu button:focus-visible {
  background: var(--color-surface-soft);
}

.task-item__menu .task-item__menu-delete {
  color: #b42318;
}

.task-item__menu .task-item__menu-delete:hover,
.task-item__menu .task-item__menu-delete:focus-visible {
  background: #fff0ef;
}

.task-item__menu svg {
  width: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
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

.task-item > .task-item__drag {
  display: grid;
  width: 1.5rem;
  height: auto;
  align-self: stretch;
  margin-block: calc(var(--space-4) * -1);
  margin-left: calc(var(--space-5) * -1);
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border-right: 1px solid var(--color-border);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  place-items: center;
}

.task-item > .task-item__drag:hover {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.task-item > .task-item__drag svg {
  width: 1.2rem;
}

@media (max-width: 900px) {
  .task-item {
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-2);
    align-items: start;
    padding: var(--space-4);
  }

  .task-item--manageable {
    grid-template-columns: auto auto minmax(0, 1fr);
  }

  .task-item__actions {
    justify-content: flex-end;
    width: max-content;
    padding: 2px;
    margin-left: 0;
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    gap: 2px;
  }

  .task-item > .task-item__drag {
    margin-left: calc(var(--space-4) * -1);
  }

  .task-item__content,
  .subtasks,
  .subtasks__add,
  .subtasks__add div,
  .subtasks ol {
    min-width: 0;
  }

  .subtasks__add div {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .subtask-item {
    grid-template-columns: auto minmax(0, 1fr);
    padding-inline: var(--space-2);
  }

  .subtask-item__actions {
    grid-column: 2;
    justify-content: flex-end;
    width: max-content;
    padding: 2px;
    margin-left: auto;
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    flex-wrap: nowrap;
    gap: 2px;
  }

  .task-item__actions .task-item__action,
  .subtask-item__actions button {
    width: 2.5rem;
    height: 2.5rem;
    background: var(--color-surface);
  }

  .subtask-item__content {
    flex-wrap: wrap;
  }
}

@media (max-width: 380px) {
  .task-item {
    padding-inline: var(--space-3);
  }

  .task-item__check-target,
  .subtask-item__check-target {
    width: 2.5rem;
  }

  .task-item__actions,
  .subtask-item__actions {
    justify-content: flex-end;
  }

  .task-item > .task-item__drag {
    margin-left: calc(var(--space-3) * -1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .task-item {
    transition: none;
  }

  .task-item__completion-feedback span,
  .task-item__completion-feedback path {
    animation: none;
  }

  .task-item__completion-feedback path {
    stroke-dashoffset: 0;
  }
}
</style>
