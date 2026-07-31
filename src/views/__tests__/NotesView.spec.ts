import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import axe from 'axe-core'
import NotesView from '@/views/NotesView.vue'
import { NOTES_STORAGE_KEY, useNotesStore } from '@/stores/notes'

const mountView = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useNotesStore().initialize()
  return mount(NotesView, { global: { plugins: [pinia] } })
}

describe('NotesView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.replaceChildren()
  })

  it('shows a dedicated empty state and creates the first note', async () => {
    const wrapper = mountView()
    expect(wrapper.get('#notes-empty-title').text()).toBe('No notes yet')

    await wrapper.get('.empty-state .app-button').trigger('click')

    expect(useNotesStore().notes).toHaveLength(1)
    expect(wrapper.find('.empty-state').exists()).toBe(false)
    expect(wrapper.get('input[name="noteTitle"]').exists()).toBe(true)
  })

  it('autosaves title and body input immediately and communicates saved state', async () => {
    vi.useFakeTimers()
    const wrapper = mountView()
    useNotesStore().createNote()
    await wrapper.vm.$nextTick()

    await wrapper.get('input[name="noteTitle"]').setValue('Project idea')
    await wrapper.get('textarea[name="noteBody"]').setValue('A calm daily review.')

    expect(wrapper.text()).toContain('Saving…')
    expect(JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) ?? '[]')[0]).toMatchObject({
      title: 'Project idea',
      body: 'A calm daily review.',
    })

    vi.advanceTimersByTime(450)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Saved')
  })

  it('opens another note and deletes the selected note', async () => {
    const wrapper = mountView()
    const store = useNotesStore()
    const first = store.createNote()
    store.updateNote(first.id, { title: 'First note' })
    const second = store.createNote()
    store.updateNote(second.id, { title: 'Second note' })
    await wrapper.vm.$nextTick()

    await wrapper.get('button[aria-current="true"]').trigger('click')
    await wrapper.get('.delete-button').trigger('click')

    expect(window.confirm).toHaveBeenCalled()
    expect(store.notes).toHaveLength(1)
    expect(store.selectedNote?.title).toBe('First note')
  })

  it('has one h1, programmatic editor labels, and no critical accessibility violations', async () => {
    const wrapper = mountView()
    useNotesStore().createNote()
    await wrapper.vm.$nextTick()
    document.body.append(wrapper.element)

    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('label[for="note-title"]').text()).toBe('Title')
    expect(wrapper.get('label[for="note-body"]').text()).toBe('Note')

    const results = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(results.violations.filter((violation) => violation.impact === 'critical')).toEqual([])
  })
})
