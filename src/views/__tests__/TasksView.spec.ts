import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import axe from 'axe-core'
import TasksView from '@/views/TasksView.vue'
import { useTasksStore } from '@/stores/tasks'

const mountTasksView = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useTasksStore().initialize()

  return mount(TasksView, {
    global: {
      plugins: [pinia],
    },
  })
}

describe('TasksView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    document.body.replaceChildren()
  })

  it('shows validation feedback and does not add an empty task', async () => {
    const wrapper = mountTasksView()

    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Task title cannot be empty')
    expect(useTasksStore().tasks).toEqual([])
  })

  it('adds a submitted task and clears the input', async () => {
    const wrapper = mountTasksView()
    const input = wrapper.get('input[name="title"]')

    await input.setValue('Plan tomorrow')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Plan tomorrow')
    expect(useTasksStore().count).toEqual({ all: 1, active: 1, completed: 0 })
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('has no critical automated accessibility violations', async () => {
    const wrapper = mountTasksView()
    document.body.append(wrapper.element)

    const results = await axe.run(document.body, {
      rules: {
        'color-contrast': { enabled: false },
      },
    })

    expect(results.violations.filter((violation) => violation.impact === 'critical')).toEqual([])
  })
})
