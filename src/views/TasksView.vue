<script setup lang="ts">
import AppButton from '../shared/ui/AppButton.vue'
import AppField from '../shared/ui/AppField.vue'
import AppSelectField from '../shared/ui/AppSelectField.vue'
import AppTaskItem from '../components/tasks/AppTaskItem.vue'
import AppTasksList from '../components/tasks/AppTasksList.vue'
import { useForm } from '@/shared/hooks/useForm.js'
import AppTasksEmptyState from "@/components/tasks/AppTasksEmptyState.vue";
import {useTasksStore} from "@/stores/tasks.ts";
import {storeToRefs} from "pinia";
import AppDatePicker from "@/shared/ui/AppDatePicker.vue";
import { compareDateStrings } from "@/shared/utils/date.ts";
import AppTaskEditDialog from '@/components/tasks/AppTaskEditDialog.vue'
import { computed, ref } from 'vue'

const tasksStore = useTasksStore()
const { count, filteredTasks, selectedFilter } = storeToRefs(tasksStore)
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

const {
  state: form,
  errors,
  handleSubmit,
  reset,
} = useForm({
  initialState: {
    title: '',
    dueTo: ''
  },
  validators: {
    title: (value) => {
      if (!value.trim()) return 'Task title cannot be empty'
    },
    dueTo: (value) => {
      if (value && compareDateStrings(value) < 0) {
        return 'Due date must be today or later'
      }
    }
  },
})

const submitTask = handleSubmit((values) => {
  addTask(values)
  reset()
})
const openEditor = (taskId: string) => {
  editingTaskId.value = taskId
}
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

      <AppButton type="submit">Add task</AppButton>
    </form>

    <div class="task-filter">
      <AppSelectField>
        <template #label>Show tasks</template>

        <select v-model="selectedFilter" aria-label="Filter tasks">
          <option value="all">All tasks</option>
          <option value="active">Active tasks</option>
          <option value="completed">Completed tasks</option>
        </select>
      </AppSelectField>
    </div>

    <AppTasksList>
      <template #summary>ALL: {{count.all}}, ACTIVE: {{ count.active }}, COMPLETED: {{ count.completed }}</template>

      <AppTasksEmptyState
        :tasks="filteredTasks"
        :selected-filter="selectedFilter"
      />

      <AppTaskItem
        v-for="task in filteredTasks"
        :key="task.id"
        :task="task"
        @delete="deleteTask"
        @edit="openEditor"
        @toggle="toggleTask"
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

.task-filter {
  width: min(100%, 15rem);
  margin: var(--space-6) 0 0 auto;
}

@media (min-width: 700px) {
  .task-form {
    grid-template-columns: minmax(0, 1fr) minmax(13rem, 0.65fr) auto;
  }

  .task-form > :last-child {
    width: auto;
    margin-top: 1.725rem;
  }
}

@media (max-width: 600px) {
  .task-filter {
    width: 100%;
  }
}
</style>
