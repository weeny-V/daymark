<script setup lang="ts">
import AppDialog from '@/shared/ui/AppDialog.vue'
import AppTaskEditor from '@/components/tasks/AppTaskEditor.vue'
import { useTasksStore } from '@/stores/tasks'
import type { Task, TaskChanges } from '@/types/Task'

const props = defineProps<{
  task: Task | null
}>()

const open = defineModel<boolean>('open', { default: false })
const { updateTask } = useTasksStore()

const close = () => {
  open.value = false
}

const save = (changes: TaskChanges) => {
  if (props.task && updateTask(props.task.id, changes)) close()
}

const removeDueDate = () => {
  if (props.task && updateTask(props.task.id, { dueTo: undefined })) close()
}
</script>

<template>
  <AppDialog
    v-if="task"
    v-model:open="open"
    title="Edit task"
    description="Update the task title, due date, or both."
  >
    <AppTaskEditor
      :key="task.id"
      :task="task"
      @save="save"
      @remove="removeDueDate"
      @cancel="close"
    />
  </AppDialog>
</template>
