import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import axe from 'axe-core'
import TodayView from '@/views/TodayView.vue'
import { useTasksStore } from '@/stores/tasks'
import { useHabitsStore } from '@/stores/habits'
import { useNotesStore } from '@/stores/notes'
import { useSettingsStore } from '@/stores/settings'

const mountView = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useSettingsStore().initialize()
  useTasksStore().initialize()
  useHabitsStore().initialize()
  useNotesStore().initialize()
  return mount(TodayView, {
    global: {
      plugins: [pinia],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  })
}

describe('TodayView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 31, 10, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.replaceChildren()
  })

  it('quick-captures a task due today without navigation', async () => {
    const wrapper = mountView()
    await wrapper.get('#quick-task-title').setValue('Prepare review')
    await wrapper.get('form[aria-label="Quick task capture"]').trigger('submit')

    expect(useTasksStore().tasks[0]).toMatchObject({ title: 'Prepare review', dueTo: '2026-07-31' })
    expect(wrapper.text()).toContain('Prepare review')
    expect((wrapper.get('#quick-task-title').element as HTMLInputElement).value).toBe('')
  })

  it('reacts immediately to due tasks, habit completion, and the pinned note', async () => {
    const wrapper = mountView()
    const tasksStore = useTasksStore()
    const habitsStore = useHabitsStore()
    const notesStore = useNotesStore()

    tasksStore.addTask({ title: 'Due work', dueTo: '2026-07-31' })
    tasksStore.addTask({ title: 'Late work', dueTo: '2026-07-30' })
    habitsStore.addHabit({ name: 'Stretch', schedule: { type: 'daily' } })
    const note = notesStore.createNote()
    notesStore.updateNote(note.id, { title: 'Keep this close', body: 'Important context' })
    notesStore.togglePin(note.id)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Due work')
    expect(wrapper.text()).toContain('Late work')
    expect(wrapper.text()).toContain('Stretch')
    expect(wrapper.text()).toContain('Keep this close')

    await wrapper.get('.habits-card input[type="checkbox"]').setValue(true)
    expect(wrapper.text()).toContain('1 of 1 completed')
  })

  it('renders useful empty states without errors', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Nothing is due today')
    expect(wrapper.text()).toContain('No habits are scheduled today')
    expect(wrapper.text()).toContain('Pin a useful note')
    expect(wrapper.findAll('.progress-segment')).toHaveLength(1)
    expect(wrapper.get('.segmented-progress__percent').text()).toBe('0%')
  })

  it('fills the water meter completely at 100 percent', async () => {
    const wrapper = mountView()
    useTasksStore().addTask({ title: 'Only check-in', dueTo: '2026-07-31' })
    await wrapper.vm.$nextTick()

    await wrapper.get('.tasks-card input[type="checkbox"]').setValue(true)

    expect(wrapper.get('.segmented-progress__percent').text()).toBe('100%')
  })

  it('has no critical automated accessibility violations', async () => {
    vi.useRealTimers()
    const wrapper = mountView()
    document.body.append(wrapper.element)
    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.filter((violation) => violation.impact === 'critical')).toEqual([])
  })
})
