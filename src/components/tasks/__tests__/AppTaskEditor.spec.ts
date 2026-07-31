import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTaskEditor from '@/components/tasks/AppTaskEditor.vue'
import type { Task } from '@/types/Task'

const task: Task = {
  id: 'task-1',
  title: 'Prepare the demo',
  completed: false,
  createdAt: '2026-07-31T08:00:00.000Z',
  dueTo: '2026-08-10',
}

describe('AppTaskEditor', () => {
  it('submits changes to both the title and due date', async () => {
    const wrapper = mount(AppTaskEditor, { props: { task } })

    await wrapper.get('input[name="editTitle"]').setValue('Present the demo')
    await wrapper.get('input[name="editDueTo"]').setValue('2026-08-12')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [{ title: 'Present the demo', dueTo: '2026-08-12' }],
    ])
  })

  it('blocks an empty title and exposes accessible feedback', async () => {
    const wrapper = mount(AppTaskEditor, { props: { task } })

    await wrapper.get('input[name="editTitle"]').setValue('   ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.get('input[name="editTitle"]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('[role="alert"]').text()).toBe('Task title cannot be empty')
  })

  it('requests due-date removal only when a due date exists', async () => {
    const wrapper = mount(AppTaskEditor, { props: { task } })

    await wrapper.get('.task-editor__remove').trigger('click')
    expect(wrapper.emitted('remove')).toEqual([[]])

    await wrapper.setProps({ task: { ...task, dueTo: undefined } })
    expect(wrapper.find('.task-editor__remove').exists()).toBe(false)
  })

  it('cancels without submitting changes', async () => {
    const wrapper = mount(AppTaskEditor, { props: { task } })

    await wrapper.get('.task-editor__cancel').trigger('click')

    expect(wrapper.emitted('cancel')).toEqual([[]])
    expect(wrapper.emitted('save')).toBeUndefined()
  })
})
