<script setup lang="ts">
import AppDialog from '@/shared/ui/AppDialog.vue'
import AppTaskEditor from '@/components/tasks/AppTaskEditor.vue'
import { useTasksStore } from '@/stores/tasks'
import type { Task, TaskChanges } from '@/types/Task'
import { ref, watch } from 'vue'

const props = defineProps<{
  task: Task | null
}>()

const open = defineModel<boolean>('open', { default: false })
const { updateTask } = useTasksStore()
const displayedTask = ref<Task | null>(props.task)

watch(
  () => props.task,
  (task) => {
    if (task) displayedTask.value = task
  },
  { immediate: true },
)

const close = () => {
  open.value = false
}

const save = (changes: TaskChanges) => {
  if (displayedTask.value && updateTask(displayedTask.value.id, changes)) close()
}

const removeDueDate = () => {
  if (displayedTask.value && updateTask(displayedTask.value.id, { dueTo: undefined })) close()
}
</script>

<template>
  <AppDialog
    v-model:open="open"
    title="Edit task"
    description="Update the task title, due date, and recurrence."
  >
    <AppTaskEditor
      v-if="displayedTask"
      :key="displayedTask.id"
      :task="displayedTask"
      @save="save"
      @remove="removeDueDate"
      @cancel="close"
    />
  </AppDialog>
</template>
