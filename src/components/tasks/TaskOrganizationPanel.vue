<script setup lang="ts">
import { reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useOrganizationStore } from '@/stores/organization'

const store = useOrganizationStore()
const { projects, tags } = storeToRefs(store)
const newProject = ref('')
const newTag = ref('')
const message = ref('')
const edits = reactive<Record<string, string>>({})

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

const save = (kind: 'project' | 'tag', id: string, currentName: string) => {
  const name = edits[id] ?? currentName
  const renamed = kind === 'project' ? store.renameProject(id, name) : store.renameTag(id, name)
  message.value = renamed ? 'Name updated.' : `Enter a unique ${kind} name.`
  if (renamed) delete edits[id]
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
            <button type="submit">Add</button>
          </div>
        </form>
        <ul>
          <li v-for="item in kind === 'project' ? projects : tags" :key="item.id">
            <label :for="`${kind}-${item.id}`">Rename {{ item.name }}</label>
            <div>
              <input
                :id="`${kind}-${item.id}`"
                :value="edits[item.id] ?? item.name"
                @input="edits[item.id] = ($event.target as HTMLInputElement).value"
              />
              <button type="button" @click="save(kind, item.id, item.name)">Save</button>
              <button type="button" @click="remove(kind, item.id)">Delete</button>
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
.organization__create div,
li div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
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
  .organization__create div,
  li div {
    grid-template-columns: 1fr 1fr;
  }
  .organization input {
    grid-column: 1 / -1;
  }
}
</style>
