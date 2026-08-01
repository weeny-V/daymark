<script setup lang="ts">
import AppButton from '../shared/ui/AppButton.vue'
import AppField from '../shared/ui/AppField.vue'
import AppSelectField from '../shared/ui/AppSelectField.vue'
import AppSelectDropdown from '../shared/ui/AppSelectDropdown.vue'
import AppTaskItem from '../components/tasks/AppTaskItem.vue'
import AppTasksList from '../components/tasks/AppTasksList.vue'
import { useForm } from '@/shared/hooks/useForm.js'
import AppTasksEmptyState from '@/components/tasks/AppTasksEmptyState.vue'
import { useTasksStore } from '@/stores/tasks.ts'
import { storeToRefs } from 'pinia'
import AppDatePicker from '@/shared/ui/AppDatePicker.vue'
import { compareDateStrings } from '@/shared/utils/date.ts'
import AppTaskEditDialog from '@/components/tasks/AppTaskEditDialog.vue'
import { computed, ref } from 'vue'
import TaskOrganizationPanel from '@/components/tasks/TaskOrganizationPanel.vue'
import { useOrganizationStore } from '@/stores/organization'
import AppTaskRecurrenceFields from '@/components/tasks/AppTaskRecurrenceFields.vue'
import type { TaskRecurrence } from '@/types/Task'
import type { TaskFilter } from '@/types/Task'

const tasksStore = useTasksStore()
const organizationStore = useOrganizationStore()
const { count, filteredTasks, selectedFilter } = storeToRefs(tasksStore)
const { projects, tags, selectedProjectId, selectedTagId } = storeToRefs(organizationStore)
const { addTask, deleteTask, toggleTask } = tasksStore
const editingTaskId = ref<string | null>(null)
const editingTask = computed(
  () => tasksStore.tasks.find((task) => task.id === editingTaskId.value) ?? null,
)
const editDialogOpen = computed({
  get: () => editingTask.value !== null,
  set: (open) => {
    if (!open) editingTaskId.value = null
  },
})
const selectedFilterModel = computed({
  get: () => selectedFilter.value,
  set: (value: string) => {
    selectedFilter.value = value as TaskFilter
  },
})
const statusFilterOptions = [
  { value: 'all', label: 'All tasks' },
  { value: 'active', label: 'Active tasks' },
  { value: 'completed', label: 'Completed tasks' },
]
const projectFilterOptions = computed(() => [
  { value: 'all', label: 'All projects' },
  ...projects.value.map((project) => ({ value: project.id, label: project.name })),
])
const tagFilterOptions = computed(() => [
  { value: 'all', label: 'All tags' },
  ...tags.value.map((tag) => ({ value: tag.id, label: tag.name })),
])

const {
  state: form,
  errors,
  handleSubmit,
  reset,
} = useForm({
  initialState: {
    title: '',
    dueTo: '',
    recurrenceType: '',
    weekdays: [] as number[],
  },
  validators: {
    title: (value) => {
      if (!value.trim()) return 'Task title cannot be empty'
    },
    dueTo: (value) => {
      if (value && compareDateStrings(value) < 0) {
        return 'Due date must be today or later'
      }
    },
    recurrenceType: (value, state) => {
      if (value && !state.dueTo) return 'Choose a due date for a recurring task'
      if (value === 'weekdays' && state.weekdays.length === 0) {
        return 'Choose at least one weekday'
      }
    },
  },
})

const submitTask = handleSubmit((values) => {
  const recurrence = values.recurrenceType
    ? values.recurrenceType === 'weekdays'
      ? { type: 'weekdays' as const, weekdays: values.weekdays }
      : { type: values.recurrenceType as 'daily' | 'weekly' }
    : undefined
  addTask({
    title: values.title,
    dueTo: values.dueTo || undefined,
    recurrence: recurrence as TaskRecurrence,
  })
  reset()
})
const openEditor = (taskId: string) => {
  editingTaskId.value = taskId
}
const moveTask = (taskId: string, direction: 'up' | 'down') => {
  tasksStore.moveTask(
    taskId,
    direction,
    filteredTasks.value.map((task) => task.id),
  )
}
const reorderTask = (taskId: string, targetId: string, position: 'before' | 'after') => {
  tasksStore.reorderTask(
    taskId,
    targetId,
    filteredTasks.value.map((task) => task.id),
    position,
  )
}
const filterSummary = computed(() => {
  const status =
    selectedFilter.value === 'all'
      ? 'All'
      : selectedFilter.value === 'active'
        ? 'Active'
        : 'Completed'
  const project = projects.value.find((item) => item.id === selectedProjectId.value)?.name
  const tag = tags.value.find((item) => item.id === selectedTagId.value)?.name
  return [`${status} tasks`, project && `project ${project}`, tag && `tag ${tag}`]
    .filter(Boolean)
    .join(', ')
})
</script>

<template>
  <section class="tasks-view">
    <header>
      <p class="eyebrow">Plan and progress</p>
      <h1>Tasks</h1>
      <p class="description">Capture, organize, and complete your work.</p>
    </header>

    <form class="task-form" @submit.prevent="submitTask">
      <AppField>
        <template #label>Task title</template>

        <input
          v-model="form.title"
          type="text"
          name="title"
          placeholder="What needs to be done?"
          :aria-invalid="!!errors.title"
          :aria-describedby="errors.title ? 'task-title-error' : undefined"
        />

        <template #message>
          <span v-if="errors.title" id="task-title-error" role="alert">
            {{ errors.title }}
          </span>
          <span v-if="!errors.title"> Enter a short, actionable task. </span>
        </template>
      </AppField>

      <AppDatePicker
        v-model="form.dueTo"
        label="Due date"
        name="dueTo"
        :error="errors.dueTo"
        hint="When should this task be completed?"
      />

      <AppTaskRecurrenceFields
        v-model:type="form.recurrenceType"
        v-model:weekdays="form.weekdays"
        :error="errors.recurrenceType"
      />

      <AppButton type="submit">Add task</AppButton>
    </form>

    <TaskOrganizationPanel />

    <div class="task-filters" aria-label="Task filters">
      <AppSelectField>
        <template #label>Show tasks</template>

        <AppSelectDropdown
          v-model="selectedFilterModel"
          :options="statusFilterOptions"
          aria-label="Filter tasks"
        />
      </AppSelectField>
      <AppSelectField>
        <template #label>Project</template>
        <AppSelectDropdown
          v-model="selectedProjectId"
          :options="projectFilterOptions"
          aria-label="Filter tasks by project"
        />
      </AppSelectField>
      <AppSelectField>
        <template #label>Tag</template>
        <AppSelectDropdown
          v-model="selectedTagId"
          :options="tagFilterOptions"
          aria-label="Filter tasks by tag"
        />
      </AppSelectField>
    </div>

    <p class="filter-summary" role="status">
      Showing {{ filteredTasks.length }}: {{ filterSummary }}
    </p>

    <AppTasksList>
      <template #summary>
        <span class="task-summary-chip task-summary-chip--all">
          <span>All</span>
          <strong>{{ count.all }}</strong>
        </span>
        <span class="task-summary-chip task-summary-chip--active">
          <span>Active</span>
          <strong>{{ count.active }}</strong>
        </span>
        <span class="task-summary-chip task-summary-chip--completed">
          <span>Completed</span>
          <strong>{{ count.completed }}</strong>
        </span>
      </template>

      <AppTasksEmptyState :tasks="filteredTasks" :selected-filter="selectedFilter" />

      <AppTaskItem
        v-for="(task, index) in filteredTasks"
        :key="task.id"
        :task="task"
        manage-subtasks
        :can-move-up="index > 0"
        :can-move-down="index < filteredTasks.length - 1"
        @delete="deleteTask"
        @edit="openEditor"
        @toggle="toggleTask"
        @move="moveTask"
        @reorder="reorderTask"
      />
    </AppTasksList>

    <AppTaskEditDialog v-model:open="editDialogOpen" :task="editingTask" />
  </section>
</template>

<style scoped>
.tasks-view {
  max-width: 52rem;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
}

.eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 750;
  text-transform: uppercase;
}

.description {
  color: var(--color-text-muted);
  line-height: 1.6;
}

.task-form {
  display: grid;
  gap: var(--space-3);
  align-items: start;
  margin-top: var(--space-8);
}

.task-form > :last-child {
  width: 100%;
}

.task-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.filter-summary {
  margin: var(--space-3) 0 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

@media (min-width: 700px) {
  .task-form {
    grid-template-columns: minmax(0, 1fr) minmax(13rem, 0.65fr);
  }

  .task-form > :last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .task-filters {
    grid-template-columns: 1fr;
  }
}
</style>
