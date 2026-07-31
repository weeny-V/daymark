import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { NOTES_STORAGE_KEY, useNotesStore } from '@/stores/notes'
import type { Note } from '@/types/Note'

const savedNote: Note = {
  id: 'note-1',
  title: 'Release notes',
  body: 'Remember the accessibility review.',
  createdAt: '2026-07-30T08:00:00.000Z',
  updatedAt: '2026-07-30T09:00:00.000Z',
}

const createStore = () => {
  setActivePinia(createPinia())
  return useNotesStore()
}

describe('notes store', () => {
  beforeEach(() => localStorage.clear())

  it('creates a note with stable identity and ISO timestamps', () => {
    const store = createStore()
    store.initialize()
    const note = store.createNote()

    expect(note.id).toEqual(expect.any(String))
    expect(new Date(note.createdAt).toISOString()).toBe(note.createdAt)
    expect(note.updatedAt).toBe(note.createdAt)
    expect(store.selectedNote?.id).toBe(note.id)
    expect(JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) ?? '[]')).toEqual([note])
  })

  it('updates and persists the latest input synchronously', () => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify([savedNote]))
    const store = createStore()
    store.initialize()

    expect(store.updateNote(savedNote.id, { title: 'Launch notes', body: 'Latest draft' })).toBe(true)

    const persisted = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) ?? '[]') as Note[]
    expect(persisted[0]).toMatchObject({ title: 'Launch notes', body: 'Latest draft' })
    expect(Date.parse(persisted[0]!.updatedAt)).toBeGreaterThanOrEqual(Date.parse(savedNote.updatedAt))
  })

  it('sorts by latest update and supports selection and deletion', () => {
    const older = { ...savedNote, id: 'older', updatedAt: '2026-07-29T09:00:00.000Z' }
    const newer = { ...savedNote, id: 'newer', updatedAt: '2026-07-31T09:00:00.000Z' }
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify([older, newer]))
    const store = createStore()
    store.initialize()

    expect(store.sortedNotes.map((note) => note.id)).toEqual(['newer', 'older'])
    expect(store.selectedNote?.id).toBe('newer')
    expect(store.selectNote('older')).toBe(true)
    expect(store.deleteNote('older')).toBe(true)
    expect(store.selectedNote?.id).toBe('newer')
    expect(store.notes.map((note) => note.id)).toEqual(['newer'])
  })

  it('rejects unknown note operations without changing state', () => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify([savedNote]))
    const store = createStore()
    store.initialize()

    expect(store.selectNote('missing')).toBe(false)
    expect(store.updateNote('missing', { title: 'No change' })).toBe(false)
    expect(store.deleteNote('missing')).toBe(false)
    expect(store.notes).toEqual([savedNote])
  })

  it('falls back safely when persisted notes are malformed', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    localStorage.setItem(
      NOTES_STORAGE_KEY,
      JSON.stringify([{ ...savedNote, updatedAt: 'not-an-iso-timestamp' }]),
    )
    const store = createStore()

    expect(() => store.initialize()).not.toThrow()
    expect(store.notes).toEqual([])
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('unexpected shape'), '')
  })
})

