<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useOrganizationStore } from '@/stores/organization'
import AppDialog from '@/shared/ui/AppDialog.vue'

const store = useOrganizationStore()
const { projects, tags } = storeToRefs(store)
const newProject = ref('')
const newTag = ref('')
const message = ref('')
const editDialogOpen = ref(false)
const editing = ref<{ kind: 'project' | 'tag'; id: string; name: string }>()
const editError = ref('')

const add = (kind: 'project' | 'tag') => {
  const value = kind === 'project' ? newProject : newTag
  const added = kind === 'project' ? store.addProject(value.value) : store.addTag(value.value)
  if (!added) {
    message.value = `Enter a unique ${kind} name.`
    return
  }
  value.value = ''
  message.value = `${kind === 'project' ? 'Project' : 'Tag'} added.`
}

const openEdit = (kind: 'project' | 'tag', id: string, name: string) => {
  editing.value = { kind, id, name }
  editError.value = ''
  editDialogOpen.value = true
}

const save = () => {
  if (!editing.value) return
  const { kind, id, name } = editing.value
  const renamed = kind === 'project' ? store.renameProject(id, name) : store.renameTag(id, name)
  if (!renamed) {
    editError.value = `Enter a unique ${kind} name.`
    return
  }
  message.value = 'Name updated.'
  editDialogOpen.value = false
}

const remove = (kind: 'project' | 'tag', id: string) => {
  if (kind === 'project') store.deleteProject(id)
  else store.deleteTag(id)
  message.value = `${kind === 'project' ? 'Project' : 'Tag'} deleted. Tasks were kept.`
}
</script>

<template>
  <section class="organization" aria-labelledby="organization-title">
    <div>
      <p class="organization__eyebrow">Workspace structure</p>
      <h2 id="organization-title">Projects and tags</h2>
      <p>
        Projects group related work; tags add flexible context. Deleting either never deletes tasks.
      </p>
    </div>
    <div class="organization__columns">
      <section
        v-for="kind in ['project', 'tag'] as const"
        :key="kind"
        :aria-labelledby="`${kind}s-title`"
      >
        <h3 :id="`${kind}s-title`">{{ kind === 'project' ? 'Projects' : 'Tags' }}</h3>
        <form class="organization__create" @submit.prevent="add(kind)">
          <label :for="`new-${kind}`">New {{ kind }}</label>
          <div>
            <input
              :id="`new-${kind}`"
              :value="kind === 'project' ? newProject : newTag"
              @input="
                kind === 'project'
                  ? (newProject = ($event.target as HTMLInputElement).value)
                  : (newTag = ($event.target as HTMLInputElement).value)
              "
            />
            <button
              class="organization__icon-button organization__add-button"
              type="submit"
              :aria-label="`Add ${kind}`"
              :title="`Add ${kind}`"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 4v12M4 10h12" />
              </svg>
            </button>
          </div>
        </form>
        <ul>
          <li v-for="item in kind === 'project' ? projects : tags" :key="item.id">
            <strong>{{ item.name }}</strong>
            <div class="organization__item-actions">
              <button
                class="organization__icon-button"
                type="button"
                :aria-label="`Edit ${kind} ${item.name}`"
                :title="`Edit ${kind}`"
                @click="openEdit(kind, item.id, item.name)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20ZM14.5 6.7l2.8 2.8" />
                </svg>
              </button>
              <button
                class="organization__icon-button organization__delete-button"
                type="button"
                :aria-label="`Delete ${kind} ${item.name}`"
                :title="`Delete ${kind}`"
                @click="remove(kind, item.id)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
                </svg>
              </button>
            </div>
          </li>
        </ul>
        <p v-if="!(kind === 'project' ? projects : tags).length" class="organization__empty">
          No {{ kind }}s yet.
        </p>
      </section>
    </div>
    <p class="organization__status" role="status" aria-live="polite">{{ message }}</p>
  </section>

  <AppDialog
    v-model:open="editDialogOpen"
    :title="`Edit ${editing?.kind ?? 'item'}`"
    description="Update the name, then save your changes."
  >
    <form
      v-if="editing"
      id="organization-edit-form"
      class="organization__edit-form"
      @submit.prevent="save"
    >
      <label for="organization-edit-name">Name</label>
      <input
        id="organization-edit-name"
        v-model="editing.name"
        :aria-invalid="!!editError"
        :aria-describedby="editError ? 'organization-edit-error' : undefined"
      />
      <p v-if="editError" id="organization-edit-error" role="alert">{{ editError }}</p>
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
        form="organization-edit-form"
      >
        Save changes
      </button>
    </template>
  </AppDialog>
</template>

<style scoped>
.organization {
  padding: var(--space-5);
  margin-top: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px var(--color-shadow);
}
.organization__eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 750;
  text-transform: uppercase;
}
h2,
h3 {
  margin: 0;
}
.organization > div > p:not(.organization__eyebrow),
.organization__empty {
  color: var(--color-text-muted);
  line-height: 1.5;
}
.organization__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
  margin-top: var(--space-5);
}
.organization__create {
  margin-top: var(--space-3);
}
.organization label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: 0.8125rem;
  font-weight: 700;
}
.organization__create div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2);
}
.organization input {
  min-width: 0;
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  font: inherit;
}
.organization button {
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-3);
  color: var(--color-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
ul {
  display: grid;
  gap: var(--space-3);
  padding: 0;
  margin: var(--space-4) 0 0;
  list-style: none;
}
li {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  min-height: 3.5rem;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
.organization__item-actions {
  display: flex;
  gap: var(--space-2);
}
.organization .organization__icon-button {
  display: grid;
  width: 2.75rem;
  padding: 0;
  place-items: center;
}
.organization__icon-button svg {
  width: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}
.organization__icon-button:hover {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
}
.organization .organization__delete-button:hover {
  color: #b42318;
  background: #fff0ef;
  border-color: color-mix(in srgb, #b42318 35%, var(--color-control-border));
}
.organization__edit-form {
  display: grid;
  gap: var(--space-2);
}
.organization__edit-form label {
  font-weight: 700;
}
.organization__edit-form input {
  width: 100%;
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  font: inherit;
}
.organization__edit-form input:hover {
  border-color: var(--color-control-hover);
}
.organization__edit-form input:focus {
  border-color: var(--color-primary);
  outline: 3px solid color-mix(in srgb, var(--color-focus) 30%, transparent);
  outline-offset: 1px;
}
.organization__edit-form p {
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
.organization__status {
  min-height: 1.5rem;
  margin: var(--space-3) 0 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
@media (max-width: 700px) {
  .organization__columns {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 440px) {
  .organization__create div {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  li {
    align-items: center;
  }
}
</style>
