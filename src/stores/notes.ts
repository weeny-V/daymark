import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import type { Note, NoteChanges } from '@/types/Note'

export const NOTES_STORAGE_KEY = 'daymark.notes'

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString() === value

const isNote = (value: unknown): value is Note => {
  if (typeof value !== 'object' || value === null) return false
  const note = value as Record<string, unknown>

  return (
    typeof note.id === 'string' &&
    typeof note.title === 'string' &&
    typeof note.body === 'string' &&
    isIsoTimestamp(note.createdAt) &&
    isIsoTimestamp(note.updatedAt)
  )
}

const isNoteList = (value: unknown): value is Note[] => Array.isArray(value) && value.every(isNote)

export const useNotesStore = defineStore('notes', () => {
  const storage = useLocalStorage<Note[]>({
    key: NOTES_STORAGE_KEY,
    fallback: () => [],
    validate: isNoteList,
  })
  const notes = ref<Note[]>([])
  const selectedNoteId = ref<string>()
  let initialized = false

  const sortedNotes = computed(() =>
    [...notes.value].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
  )
  const selectedNote = computed(() =>
    notes.value.find((note) => note.id === selectedNoteId.value),
  )

  const persist = () => storage.set(notes.value)

  const initialize = () => {
    if (initialized) return
    notes.value = storage.get()
    selectedNoteId.value = sortedNotes.value[0]?.id
    initialized = true
  }

  const createNote = () => {
    const timestamp = new Date().toISOString()
    const note: Note = {
      id: crypto.randomUUID(),
      title: '',
      body: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    notes.value.push(note)
    selectedNoteId.value = note.id
    persist()
    return note
  }

  const selectNote = (id: string) => {
    if (!notes.value.some((note) => note.id === id)) return false
    selectedNoteId.value = id
    return true
  }

  const updateNote = (id: string, changes: NoteChanges) => {
    const note = notes.value.find((item) => item.id === id)
    if (!note) return false
    if (changes.title !== undefined) note.title = changes.title
    if (changes.body !== undefined) note.body = changes.body
    note.updatedAt = new Date().toISOString()
    return persist()
  }

  const deleteNote = (id: string) => {
    const index = notes.value.findIndex((note) => note.id === id)
    if (index < 0) return false
    notes.value.splice(index, 1)

    if (selectedNoteId.value === id) {
      selectedNoteId.value = sortedNotes.value[0]?.id
    }
    persist()
    return true
  }

  return {
    notes,
    selectedNoteId,
    selectedNote,
    sortedNotes,
    initialize,
    createNote,
    selectNote,
    updateNote,
    deleteNote,
  }
})
