import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import axe from 'axe-core'
import FocusView from '@/views/FocusView.vue'
import { useFocusStore } from '@/stores/focus'
import { useTasksStore } from '@/stores/tasks'

const mountView = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useTasksStore().initialize()
  useFocusStore().initialize()
  return mount(FocusView, { global: { plugins: [pinia] } })
}

describe('FocusView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-01T10:00:00.000Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.replaceChildren()
  })

  it('starts, pauses, resumes, and resets with accessible state text', async () => {
    const wrapper = mountView()
    expect(wrapper.get('[role="timer"]').attributes('aria-label')).toContain('Ready')
    await wrapper.get('.timer-actions .app-button').trigger('click')
    expect(wrapper.text()).toContain('Running')
    await vi.advanceTimersByTimeAsync(2_000)
    expect(wrapper.get('[role="timer"]').text()).toBe('24:58')
    await wrapper.get('.timer-actions .app-button').trigger('click')
    expect(wrapper.text()).toContain('Paused')
    await wrapper.get('.timer-actions .app-button').trigger('click')
    expect(wrapper.text()).toContain('Running')
    await wrapper.get('.timer-actions button:not(.app-button)').trigger('click')
    expect(wrapper.text()).toContain('Ready')
  })

  it('associates a focus session with an active task and handles its deletion', async () => {
    const wrapper = mountView()
    const tasks = useTasksStore()
    tasks.addTask({ title: 'Write report' })
    await wrapper.vm.$nextTick()
    const taskId = tasks.tasks[0]!.id
    await wrapper.get('select').setValue(taskId)
    useFocusStore().setDurations(1, 1)
    await wrapper.get('.timer-actions .app-button').trigger('click')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(wrapper.text()).toContain('Task: Write report')
    tasks.deleteTask(taskId)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Task: Deleted task')
  })

  it('has no critical automated accessibility violations', async () => {
    vi.useRealTimers()
    const wrapper = mountView()
    document.body.append(wrapper.element)
    const results = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(results.violations.filter((violation) => violation.impact === 'critical')).toEqual([])
  })
})
