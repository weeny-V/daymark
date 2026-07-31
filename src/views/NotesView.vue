<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import AppButton from '@/shared/ui/AppButton.vue'
import { useNotesStore } from '@/stores/notes'
import { useTasksStore } from '@/stores/tasks'
import type { NoteChanges } from '@/types/Note'

const store = useNotesStore()
const tasksStore = useTasksStore()
const { filteredNotes, searchQuery, selectedNote, sortedNotes } = storeToRefs(store)
const { tasks } = storeToRefs(tasksStore)
const titleInput = useTemplateRef<HTMLInputElement>('titleInput')
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const taskToLink = ref('')
let savedTimer: ReturnType<typeof setTimeout> | undefined

const noteCountLabel = computed(() =>
  sortedNotes.value.length === 1 ? '1 note' : `${sortedNotes.value.length} notes`,
)
const linkedTasks = computed(() =>
  (selectedNote.value?.linkedTaskIds ?? []).map((id) => ({
    id,
    task: tasks.value.find((task) => task.id === id),
  })),
)
const availableTasks = computed(() =>
  tasks.value.filter((task) => !selectedNote.value?.linkedTaskIds.includes(task.id)),
)

const displayTitle = (title: string) => title.trim() || 'Untitled note'
const preview = (body: string) => body.trim().replace(/\s+/g, ' ') || 'No content yet'

const createNote = async () => {
  store.createNote()
  saveStatus.value = 'saved'
  await nextTick()
  titleInput.value?.focus()
}

const updateSelectedNote = (changes: NoteChanges) => {
  if (!selectedNote.value) return
  saveStatus.value = 'saving'
  window.clearTimeout(savedTimer)
  const saved = store.updateNote(selectedNote.value.id, changes)
  if (!saved) {
    saveStatus.value = 'error'
    return
  }
  savedTimer = window.setTimeout(() => {
    saveStatus.value = 'saved'
  }, 450)
}

const selectNote = (id: string) => {
  store.selectNote(id)
  saveStatus.value = 'idle'
}

const deleteSelectedNote = () => {
  const note = selectedNote.value
  if (!note || !window.confirm(`Delete “${displayTitle(note.title)}”? This cannot be undone.`)) return
  store.deleteNote(note.id)
  saveStatus.value = 'idle'
}

const toggleSelectedPin = () => {
  if (!selectedNote.value) return
  saveStatus.value = store.togglePin(selectedNote.value.id) ? 'saved' : 'error'
}

const addTaskLink = () => {
  if (!selectedNote.value || !taskToLink.value) return
  if (store.linkTask(selectedNote.value.id, taskToLink.value)) {
    taskToLink.value = ''
    saveStatus.value = 'saved'
  }
}

const removeTaskLink = (taskId: string) => {
  if (!selectedNote.value) return
  if (store.unlinkTask(selectedNote.value.id, taskId)) saveStatus.value = 'saved'
}

watch(selectedNote, () => {
  taskToLink.value = ''
})

onBeforeUnmount(() => window.clearTimeout(savedTimer))
</script>

<template>
  <section class="notes-view">
    <header class="page-header">
      <div>
        <p class="eyebrow">Ideas and references</p>
        <h1>Notes</h1>
        <p class="description">Capture a thought and return to it whenever you are ready.</p>
      </div>
      <AppButton @click="createNote">New note</AppButton>
    </header>

    <section v-if="!sortedNotes.length" class="empty-state" aria-labelledby="notes-empty-title">
      <span class="empty-state__icon" aria-hidden="true">✎</span>
      <p class="eyebrow">A clear page</p>
      <h2 id="notes-empty-title">No notes yet</h2>
      <p>Start with an idea, a useful reference, or anything you want to remember.</p>
      <AppButton @click="createNote">Create your first note</AppButton>
    </section>

    <div v-else class="workspace">
      <aside class="note-list" aria-labelledby="note-list-title">
        <div class="note-list__heading">
          <h2 id="note-list-title">Your notes</h2>
          <span>{{ noteCountLabel }}</span>
        </div>
        <div class="note-search">
          <label for="note-search">Search notes</label>
          <input
            id="note-search"
            v-model="searchQuery"
            type="search"
            placeholder="Search title or content"
          />
        </div>
        <p v-if="!filteredNotes.length" class="search-empty" role="status">
          No notes match “{{ searchQuery.trim() }}”. Try another search.
        </p>
        <ul>
          <li v-for="note in filteredNotes" :key="note.id">
            <button
              type="button"
              :class="{ active: note.id === selectedNote?.id }"
              :aria-current="note.id === selectedNote?.id ? 'true' : undefined"
              @click="selectNote(note.id)"
            >
              <strong>{{ displayTitle(note.title) }}</strong>
              <span v-if="note.pinned" class="pin-label"><span aria-hidden="true">★</span> Pinned</span>
              <span>{{ preview(note.body) }}</span>
              <time :datetime="note.updatedAt">{{ dayjs(note.updatedAt).format('MMM D, h:mm A') }}</time>
            </button>
          </li>
        </ul>
      </aside>

      <section v-if="selectedNote" class="editor" aria-labelledby="note-editor-title">
        <div class="editor__toolbar">
          <div>
            <h2 id="note-editor-title">Edit note</h2>
            <p class="save-status" aria-live="polite">
              <span v-if="saveStatus === 'saving'">Saving…</span>
              <span v-else-if="saveStatus === 'saved'">Saved</span>
              <span v-else-if="saveStatus === 'error'" class="save-status__error">Could not save</span>
              <span v-else>Changes save automatically</span>
            </p>
          </div>
          <div class="editor__actions">
            <button
              class="pin-button"
              type="button"
              :aria-pressed="selectedNote.pinned"
              @click="toggleSelectedPin"
            >
              <span aria-hidden="true">{{ selectedNote.pinned ? '★' : '☆' }}</span>
              {{ selectedNote.pinned ? 'Unpin note' : 'Pin note' }}
            </button>
            <button class="delete-button" type="button" @click="deleteSelectedNote">Delete note</button>
          </div>
        </div>

        <div class="editor__fields">
          <label for="note-title">Title</label>
          <input
            id="note-title"
            ref="titleInput"
            :value="selectedNote.title"
            name="noteTitle"
            placeholder="Untitled note"
            autocomplete="off"
            @input="updateSelectedNote({ title: ($event.target as HTMLInputElement).value })"
          />

          <label for="note-body">Note</label>
          <textarea
            id="note-body"
            :value="selectedNote.body"
            name="noteBody"
            placeholder="Write something worth returning to…"
            @input="updateSelectedNote({ body: ($event.target as HTMLTextAreaElement).value })"
          />
        </div>

        <section class="task-links" aria-labelledby="task-links-title">
          <div>
            <h3 id="task-links-title">Linked tasks</h3>
            <p>Connect this note to work already tracked in Daymark.</p>
          </div>

          <ul v-if="linkedTasks.length" class="linked-task-list">
            <li v-for="linked in linkedTasks" :key="linked.id">
              <RouterLink
                v-if="linked.task"
                :to="{ path: '/tasks', hash: `#task-${linked.id}` }"
              >
                {{ linked.task.title }}
              </RouterLink>
              <span v-else class="missing-task"><span aria-hidden="true">!</span> Unavailable task</span>
              <button
                type="button"
                :aria-label="`Unlink ${linked.task?.title ?? 'unavailable task'}`"
                @click="removeTaskLink(linked.id)"
              >
                Unlink
              </button>
            </li>
          </ul>
          <p v-else class="task-links__empty">No tasks linked to this note.</p>

          <div v-if="availableTasks.length" class="link-task-control">
            <label for="task-to-link">Task to link</label>
            <div>
              <select id="task-to-link" v-model="taskToLink">
                <option value="">Choose a task</option>
                <option v-for="task in availableTasks" :key="task.id" :value="task.id">
                  {{ task.title }}
                </option>
              </select>
              <button type="button" :disabled="!taskToLink" @click="addTaskLink">Link task</button>
            </div>
          </div>
          <p v-else-if="!tasks.length" class="task-links__empty">
            Add a task before linking planning context.
          </p>
        </section>

        <footer class="editor__meta">
          <span>Created {{ dayjs(selectedNote.createdAt).format('MMMM D, YYYY') }}</span>
          <span>Updated {{ dayjs(selectedNote.updatedAt).format('h:mm A') }}</span>
        </footer>
      </section>
    </div>
  </section>
</template>

<style scoped>
.notes-view { max-width: 70rem; }
.page-header, .editor__toolbar, .note-list__heading, .editor__meta { display: flex; gap: var(--space-4); align-items: flex-start; justify-content: space-between; }
.eyebrow { margin: 0 0 var(--space-2); color: var(--color-primary); font-size: .75rem; font-weight: 750; letter-spacing: .09em; text-transform: uppercase; }
h1 { margin: 0; font-size: clamp(2rem, 5vw, 3rem); letter-spacing: -.045em; }
h2 { margin: 0; font-size: 1.25rem; }
.description { margin: var(--space-3) 0 0; color: var(--color-text-muted); line-height: 1.65; }
.empty-state, .note-list, .editor { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: 0 8px 24px var(--color-shadow); }
.empty-state { display: grid; justify-items: center; max-width: 42rem; padding: var(--space-8) var(--space-5); margin: var(--space-8) auto 0; text-align: center; }
.empty-state__icon { display: grid; width: 3.5rem; height: 3.5rem; margin-bottom: var(--space-4); color: var(--color-primary); background: var(--color-primary-soft); border-radius: 50%; font-size: 1.5rem; font-weight: 800; place-items: center; }
.empty-state > p:not(.eyebrow) { max-width: 30rem; margin: var(--space-3) 0 var(--space-5); color: var(--color-text-muted); line-height: 1.65; }
.workspace { display: grid; grid-template-columns: minmax(15rem, 20rem) minmax(0, 1fr); gap: var(--space-5); align-items: start; margin-top: var(--space-8); }
.note-list { min-width: 0; overflow: hidden; }
.note-list__heading { align-items: center; padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--color-border); }
.note-list__heading span { color: var(--color-text-muted); font-size: .8125rem; }
.note-list ul { display: grid; gap: var(--space-1); max-height: 38rem; padding: var(--space-2); margin: 0; overflow-y: auto; list-style: none; }
.note-list button { display: grid; gap: var(--space-1); width: 100%; min-height: 5.5rem; padding: var(--space-3); color: var(--color-text); background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); text-align: left; cursor: pointer; }
.note-list button:hover { background: var(--color-surface-soft); }
.note-list button.active { background: var(--color-primary-soft); border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border)); }
.note-list button strong, .note-list button span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.note-list button span, .note-list time { color: var(--color-text-muted); font-size: .8125rem; }
.editor { min-width: 0; overflow: hidden; }
.editor__toolbar { padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--color-border); }
.save-status { min-height: 1.25rem; margin: var(--space-1) 0 0; color: var(--color-text-muted); font-size: .8125rem; }
.save-status__error { color: #b42318; font-weight: 650; }
.editor__actions { display: flex; flex-wrap: wrap; gap: var(--space-1); }
.delete-button, .pin-button { min-height: 2.75rem; padding: var(--space-2) var(--space-3); background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; }
.delete-button { color: #b42318; }
.pin-button { color: var(--color-primary); }
.pin-button:hover { background: var(--color-primary-soft); border-color: var(--color-primary); }
.delete-button:hover { background: #fff0ef; border-color: #f2c1bd; }
.editor__fields { display: grid; padding: var(--space-5); }
.editor__fields label { margin-bottom: var(--space-2); font-size: .8125rem; font-weight: 700; }
.editor__fields input, .editor__fields textarea { width: 100%; min-width: 0; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-control-border); border-radius: var(--radius-sm); outline: none; font: inherit; }
.editor__fields input { min-height: 3rem; padding: var(--space-3) var(--space-4); margin-bottom: var(--space-5); font-size: 1.125rem; font-weight: 700; }
.editor__fields textarea { min-height: 22rem; padding: var(--space-4); line-height: 1.65; resize: vertical; }
.editor__fields input:focus-visible, .editor__fields textarea:focus-visible { border-color: var(--color-focus); box-shadow: 0 0 0 3px rgb(47 111 237 / 16%); }
.editor__meta { flex-wrap: wrap; padding: var(--space-3) var(--space-5); color: var(--color-text-muted); background: var(--color-surface-soft); border-top: 1px solid var(--color-border); font-size: .75rem; }
.note-search { display: grid; gap: var(--space-2); padding: var(--space-3); border-bottom: 1px solid var(--color-border); }
.note-search label, .link-task-control label { font-size: .8125rem; font-weight: 700; }
.note-search input, .link-task-control select { width: 100%; min-width: 0; min-height: 2.75rem; padding: var(--space-2) var(--space-3); color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-control-border); border-radius: var(--radius-sm); font: inherit; }
.search-empty { padding: var(--space-4); margin: 0; color: var(--color-text-muted); line-height: 1.5; }
.pin-label { color: var(--color-primary) !important; font-weight: 750; }
.task-links { display: grid; gap: var(--space-4); padding: 0 var(--space-5) var(--space-5); }
.task-links h3 { margin: 0; font-size: 1rem; }
.task-links > div > p, .task-links__empty { margin: var(--space-1) 0 0; color: var(--color-text-muted); font-size: .8125rem; line-height: 1.5; }
.linked-task-list { display: grid; gap: var(--space-2); padding: 0; margin: 0; list-style: none; }
.linked-task-list li { display: flex; gap: var(--space-3); align-items: center; justify-content: space-between; min-height: 3rem; padding: var(--space-2) var(--space-3); background: var(--color-surface-soft); border-radius: var(--radius-sm); }
.linked-task-list a { min-width: 0; color: var(--color-primary); font-weight: 700; overflow-wrap: anywhere; }
.linked-task-list button, .link-task-control button { min-height: 2.75rem; padding: var(--space-2) var(--space-3); color: var(--color-primary); background: var(--color-surface); border: 1px solid var(--color-control-border); border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; }
.missing-task { display: inline-flex; gap: var(--space-2); align-items: center; color: var(--color-text-muted); }
.missing-task > span { display: grid; width: 1.25rem; height: 1.25rem; color: #fff; background: #8a6d1d; border-radius: 50%; font-size: .75rem; font-weight: 800; place-items: center; }
.link-task-control { display: grid; gap: var(--space-2); }
.link-task-control > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--space-2); }
.link-task-control button:disabled { cursor: not-allowed; opacity: .55; }
:global(:root[data-theme='dark']) .delete-button:hover { background: #4a2528; border-color: #754047; }
@media (max-width: 800px) { .workspace { grid-template-columns: 1fr; } .note-list ul { max-height: 18rem; } }
@media (max-width: 560px) { .page-header, .editor__toolbar { flex-direction: column; } .page-header :deep(.app-button), .editor__actions { width: 100%; } .editor__actions > button { flex: 1; } .editor__fields textarea { min-height: 18rem; } .link-task-control > div { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; } }
</style>
