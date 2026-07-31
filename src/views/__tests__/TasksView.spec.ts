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

  it('updates a task title and due date from the edit dialog', async () => {
    const wrapper = mountTasksView()
    const store = useTasksStore()
    store.addTask({ title: 'Original task', dueTo: '2026-08-10' })
    await wrapper.vm.$nextTick()

    await wrapper.get('button[aria-label="Edit Original task"]').trigger('click')
    await wrapper.get('input[name="editTitle"]').setValue('Updated task')
    await wrapper.get('input[name="editDueTo"]').setValue('2026-08-12')
    await wrapper.get('form[aria-label="Edit task"]').trigger('submit')

    expect(store.tasks[0]).toMatchObject({ title: 'Updated task', dueTo: '2026-08-12' })
    expect(wrapper.find('dialog').exists()).toBe(false)
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
