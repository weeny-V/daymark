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
    (note.pinned === undefined || typeof note.pinned === 'boolean') &&
    (note.linkedTaskIds === undefined ||
      (Array.isArray(note.linkedTaskIds) &&
        note.linkedTaskIds.every((id) => typeof id === 'string'))) &&
    isIsoTimestamp(note.createdAt) &&
    isIsoTimestamp(note.updatedAt)
  )
}

export const isNoteList = (value: unknown): value is Note[] =>
  Array.isArray(value) && value.every(isNote)

export const useNotesStore = defineStore('notes', () => {
  const storage = useLocalStorage<Note[]>({
    key: NOTES_STORAGE_KEY,
    fallback: () => [],
    validate: isNoteList,
  })
  const notes = ref<Note[]>([])
  const selectedNoteId = ref<string>()
  const searchQuery = ref('')
  let initialized = false

  const sortedNotes = computed(() =>
    [...notes.value].sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    ),
  )
  const filteredNotes = computed(() => {
    const query = searchQuery.value.trim().toLocaleLowerCase()
    if (!query) return sortedNotes.value
    return sortedNotes.value.filter(
      (note) =>
        note.title.toLocaleLowerCase().includes(query) ||
        note.body.toLocaleLowerCase().includes(query),
    )
  })
  const pinnedNote = computed(() => sortedNotes.value.find((note) => note.pinned))
  const selectedNote = computed(() => notes.value.find((note) => note.id === selectedNoteId.value))

  const persist = () => storage.set(notes.value)

  const initialize = () => {
    if (initialized) return
    notes.value = storage.get().map((note) => ({
      ...note,
      pinned: note.pinned ?? false,
      linkedTaskIds: [...new Set(note.linkedTaskIds ?? [])],
    }))
    selectedNoteId.value = sortedNotes.value[0]?.id
    initialized = true
  }

  const createNote = () => {
    const timestamp = new Date().toISOString()
    const note: Note = {
      id: crypto.randomUUID(),
      title: '',
      body: '',
      pinned: false,
      linkedTaskIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    notes.value.push(note)
    selectedNoteId.value = note.id
    persist()
    return note
  }

  const replaceAll = (value: Note[]) => {
    notes.value = structuredClone(value)
    selectedNoteId.value = sortedNotes.value[0]?.id
    persist()
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

  const togglePin = (id: string) => {
    const note = notes.value.find((item) => item.id === id)
    if (!note) return false
    note.pinned = !note.pinned
    note.updatedAt = new Date().toISOString()
    return persist()
  }

  const linkTask = (noteId: string, taskId: string) => {
    const note = notes.value.find((item) => item.id === noteId)
    if (!note || !taskId || note.linkedTaskIds.includes(taskId)) return false
    note.linkedTaskIds.push(taskId)
    note.updatedAt = new Date().toISOString()
    return persist()
  }

  const unlinkTask = (noteId: string, taskId: string) => {
    const note = notes.value.find((item) => item.id === noteId)
    if (!note || !note.linkedTaskIds.includes(taskId)) return false
    note.linkedTaskIds = note.linkedTaskIds.filter((id) => id !== taskId)
    note.updatedAt = new Date().toISOString()
    return persist()
  }

  return {
    notes,
    selectedNoteId,
    selectedNote,
    sortedNotes,
    filteredNotes,
    pinnedNote,
    searchQuery,
    initialize,
    replaceAll,
    createNote,
    selectNote,
    updateNote,
    deleteNote,
    togglePin,
    linkTask,
    unlinkTask,
  }
})
