<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import AppButton from '@/shared/ui/AppButton.vue'
import { useNotesStore } from '@/stores/notes'
import type { NoteChanges } from '@/types/Note'

const store = useNotesStore()
const { selectedNote, sortedNotes } = storeToRefs(store)
const titleInput = useTemplateRef<HTMLInputElement>('titleInput')
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
let savedTimer: ReturnType<typeof setTimeout> | undefined

const noteCountLabel = computed(() =>
  sortedNotes.value.length === 1 ? '1 note' : `${sortedNotes.value.length} notes`,
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
        <ul>
          <li v-for="note in sortedNotes" :key="note.id">
            <button
              type="button"
              :class="{ active: note.id === selectedNote?.id }"
              :aria-current="note.id === selectedNote?.id ? 'true' : undefined"
              @click="selectNote(note.id)"
            >
              <strong>{{ displayTitle(note.title) }}</strong>
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
          <button class="delete-button" type="button" @click="deleteSelectedNote">Delete note</button>
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
.delete-button { min-height: 2.75rem; padding: var(--space-2) var(--space-3); color: #b42318; background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; }
.delete-button:hover { background: #fff0ef; border-color: #f2c1bd; }
.editor__fields { display: grid; padding: var(--space-5); }
.editor__fields label { margin-bottom: var(--space-2); font-size: .8125rem; font-weight: 700; }
.editor__fields input, .editor__fields textarea { width: 100%; min-width: 0; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-control-border); border-radius: var(--radius-sm); outline: none; font: inherit; }
.editor__fields input { min-height: 3rem; padding: var(--space-3) var(--space-4); margin-bottom: var(--space-5); font-size: 1.125rem; font-weight: 700; }
.editor__fields textarea { min-height: 22rem; padding: var(--space-4); line-height: 1.65; resize: vertical; }
.editor__fields input:focus-visible, .editor__fields textarea:focus-visible { border-color: var(--color-focus); box-shadow: 0 0 0 3px rgb(47 111 237 / 16%); }
.editor__meta { flex-wrap: wrap; padding: var(--space-3) var(--space-5); color: var(--color-text-muted); background: var(--color-surface-soft); border-top: 1px solid var(--color-border); font-size: .75rem; }
:global(:root[data-theme='dark']) .delete-button:hover { background: #4a2528; border-color: #754047; }
@media (max-width: 800px) { .workspace { grid-template-columns: 1fr; } .note-list ul { max-height: 18rem; } }
@media (max-width: 560px) { .page-header, .editor__toolbar { flex-direction: column; } .page-header :deep(.app-button) { width: 100%; } .delete-button { align-self: stretch; } .editor__fields textarea { min-height: 18rem; } }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; } }
</style>
