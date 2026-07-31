import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AppTaskItem from '@/components/tasks/AppTaskItem.vue'
import type { Task } from '@/types/Task'

const task: Task = {
  id: 'task-1',
  title: 'Prepare the weekly review',
  completed: false,
  createdAt: '2026-07-29T08:00:00.000Z',
}

describe('AppTaskItem', () => {
  const mountTaskItem = () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    return mount(AppTaskItem, {
      props: { task },
      global: { plugins: [pinia] },
    })
  }

  it('requests completion for the selected task', async () => {
    const wrapper = mountTaskItem()

    await wrapper.get('input[type="checkbox"]').trigger('change')

    expect(wrapper.emitted('toggle')).toEqual([[task.id]])
  })

  it('requests deletion for the selected task', async () => {
    const wrapper = mountTaskItem()

    await wrapper.get(`button[aria-label="Delete ${task.title}"]`).trigger('click')

    expect(wrapper.emitted('delete')).toEqual([[task.id]])
  })

  it('requests editing for the selected task', async () => {
    const wrapper = mountTaskItem()

    await wrapper.get(`button[aria-label="Edit ${task.title}"]`).trigger('click')

    expect(wrapper.emitted('edit')).toEqual([[task.id]])
  })

  it('shows a formatted due date when the task has one', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(AppTaskItem, {
      props: { task: { ...task, dueTo: '2026-08-10' } },
      global: { plugins: [pinia] },
    })
    const dueDate = wrapper.get('.task-item__due-date time')

    expect(dueDate.attributes('datetime')).toBe('2026-08-10')
    expect(dueDate.text()).toBe('August 10, 2026')
  })

  it('does not show a due date for unscheduled tasks', () => {
    const wrapper = mountTaskItem()

    expect(wrapper.find('.task-item__due-date').exists()).toBe(false)
  })

  it('identifies a recurring task without relying on color', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(AppTaskItem, {
      props: { task: { ...task, dueTo: '2026-08-10', recurrence: { type: 'weekly' } } },
      global: { plugins: [pinia] },
    })

    expect(wrapper.get('.task-item__recurrence').text()).toBe('Repeats weekly')
  })
})
