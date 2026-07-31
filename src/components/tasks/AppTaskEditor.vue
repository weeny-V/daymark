<script setup lang="ts">
import dayjs from 'dayjs'
import AppDatePicker from '@/shared/ui/AppDatePicker.vue'
import AppField from '@/shared/ui/AppField.vue'
import { useForm } from '@/shared/hooks/useForm'
import type { Task, TaskChanges } from '@/types/Task'
import { storeToRefs } from 'pinia'
import { useOrganizationStore } from '@/stores/organization'

const { projects, tags } = storeToRefs(useOrganizationStore())

const props = withDefaults(
  defineProps<{
    task: Task
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  save: [changes: TaskChanges]
  remove: []
  cancel: []
}>()

const {
  state: form,
  errors,
  handleSubmit,
} = useForm({
  initialState: {
    title: props.task.title,
    dueTo: props.task.dueTo ?? '',
    projectId: props.task.projectId ?? '',
    tagIds: props.task.tagIds ?? [],
  },
  validators: {
    title: (value) => {
      if (!value.trim()) return 'Task title cannot be empty'
    },
    dueTo: (value) => {
      if (value && (!dayjs(value).isValid() || dayjs(value).format('YYYY-MM-DD') !== value)) {
        return 'Enter a valid due date'
      }
    },
  },
})

const submit = handleSubmit((values) => {
  emit('save', {
    title: values.title.trim(),
    dueTo: values.dueTo || undefined,
    projectId: values.projectId || undefined,
    tagIds: values.tagIds,
  })
})
</script>

<template>
  <form class="task-editor" aria-label="Edit task" @submit.prevent="submit">
    <AppField>
      <template #label>Task title</template>

      <input
        v-model="form.title"
        type="text"
        name="editTitle"
        autocomplete="off"
        :disabled="disabled"
        :aria-invalid="!!errors.title"
        :aria-describedby="errors.title ? 'edit-task-title-error' : undefined"
      />

      <template #message>
        <span v-if="errors.title" id="edit-task-title-error" role="alert">
          {{ errors.title }}
        </span>
        <span v-else>Use a short, actionable title.</span>
      </template>
    </AppField>

    <AppDatePicker
      v-model="form.dueTo"
      label="Due date"
      name="editDueTo"
      hint="Choose a date, or leave it empty for no due date."
      :error="errors.dueTo"
      :disabled="disabled"
    />

    <div class="task-editor__organization">
      <label>
        <span>Project</span>
        <select v-model="form.projectId" :disabled="disabled">
          <option value="">No project</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.name }}
          </option>
        </select>
      </label>
      <fieldset>
        <legend>Tags</legend>
        <label v-for="tag in tags" :key="tag.id">
          <input v-model="form.tagIds" type="checkbox" :value="tag.id" :disabled="disabled" />
          {{ tag.name }}
        </label>
        <p v-if="!tags.length">Create tags from the Tasks page to assign them here.</p>
      </fieldset>
    </div>

    <div class="task-editor__actions">
      <button
        v-if="task.dueTo"
        class="task-editor__remove"
        type="button"
        :disabled="disabled"
        @click="$emit('remove')"
      >
        Remove due date
      </button>

      <div class="task-editor__primary-actions">
        <button
          class="task-editor__cancel"
          type="button"
          :disabled="disabled"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button class="task-editor__save" type="submit" :disabled="disabled">Save changes</button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.task-editor {
  display: grid;
  gap: var(--space-5);
}

.task-editor__actions {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.task-editor__organization {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.task-editor__organization > label > span,
.task-editor__organization legend {
  display: block;
  margin-bottom: var(--space-2);
  font-size: 0.875rem;
  font-weight: 700;
}
.task-editor__organization select {
  width: 100%;
  min-height: 2.75rem;
  padding: var(--space-2);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  font: inherit;
}
.task-editor__organization fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
  border: 0;
}
.task-editor__organization fieldset label {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  min-height: 2.75rem;
}
.task-editor__organization fieldset p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.task-editor__primary-actions {
  display: flex;
  gap: var(--space-2);
  margin-left: auto;
}

.task-editor__actions button,
.task-editor__primary-actions button {
  min-height: 2.75rem;
  padding: var(--space-3) var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 2px rgb(24 26 32 / 8%);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.task-editor__actions .task-editor__save {
  color: #fff;
  background: var(--color-primary);
  box-shadow: 0 2px 6px rgb(101 88 211 / 24%);
}

.task-editor__save:hover:not(:disabled) {
  background: #574bc3;
  box-shadow: 0 4px 12px rgb(101 88 211 / 28%);
}

.task-editor__actions .task-editor__remove {
  color: #b42318;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.task-editor__remove:hover:not(:disabled) {
  background: #fff0ef;
  border-color: #f2c1bd;
}

.task-editor__actions .task-editor__cancel {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: var(--color-control-border);
}

.task-editor__cancel:hover:not(:disabled) {
  background: var(--color-surface-soft);
  border-color: var(--color-control-hover);
}

.task-editor__actions button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--color-focus) 35%, transparent);
  outline-offset: 2px;
}

.task-editor__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

:global(:root[data-theme='dark']) .task-editor__remove {
  color: #ffaaa3;
}

:global(:root[data-theme='dark']) .task-editor__remove:hover:not(:disabled) {
  background: #4a2528;
  border-color: #754047;
}

@media (max-width: 480px) {
  .task-editor__organization {
    grid-template-columns: 1fr;
  }
  .task-editor__actions {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .task-editor__primary-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    margin-left: 0;
  }

  .task-editor__actions button,
  .task-editor__primary-actions button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .task-editor__actions button {
    transition: none;
  }
}
</style>
