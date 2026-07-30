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
})
