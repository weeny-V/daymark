import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTaskEditor from '@/components/tasks/AppTaskEditor.vue'
import type { Task } from '@/types/Task'
import { createPinia, setActivePinia } from 'pinia'

const task: Task = {
  id: 'task-1',
  title: 'Prepare the demo',
  completed: false,
  createdAt: '2026-07-31T08:00:00.000Z',
  dueTo: '2026-08-10',
}

describe('AppTaskEditor', () => {
  const mountEditor = () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    return mount(AppTaskEditor, { props: { task }, global: { plugins: [pinia] } })
  }

  it('submits changes to both the title and due date', async () => {
    const wrapper = mountEditor()

    await wrapper.get('input[name="editTitle"]').setValue('Present the demo')
    await wrapper.get('.date-picker__trigger').trigger('click')
    await wrapper.get('button[aria-label="Wednesday, August 12, 2026"]').trigger('click')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          title: 'Present the demo',
          dueTo: '2026-08-12',
          projectId: undefined,
          tagIds: [],
          recurrence: undefined,
        },
      ],
    ])
  })

  it('blocks an empty title and exposes accessible feedback', async () => {
    const wrapper = mountEditor()

    await wrapper.get('input[name="editTitle"]').setValue('   ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.get('input[name="editTitle"]').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('[role="alert"]').text()).toBe('Task title cannot be empty')
  })

  it('requests due-date removal only when a due date exists', async () => {
    const wrapper = mountEditor()

    await wrapper.get('.task-editor__remove').trigger('click')
    expect(wrapper.emitted('remove')).toEqual([[]])

    await wrapper.setProps({ task: { ...task, dueTo: undefined } })
    expect(wrapper.find('.task-editor__remove').exists()).toBe(false)
  })

  it('cancels without submitting changes', async () => {
    const wrapper = mountEditor()

    await wrapper.get('.task-editor__cancel').trigger('click')

    expect(wrapper.emitted('cancel')).toEqual([[]])
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('creates, edits, and removes a recurrence rule', async () => {
    const wrapper = mountEditor()

    await wrapper.get('.select-dropdown__trigger').trigger('click')
    await wrapper.findAll('[role="option"]')[3]!.trigger('click')
    const weekdayInputs = wrapper.findAll('.recurrence-fields__weekdays input')
    await weekdayInputs[0]!.setValue(true)
    await weekdayInputs[2]!.setValue(true)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      recurrence: { type: 'weekdays', weekdays: [1, 3] },
    })

    await wrapper.get('.select-dropdown__trigger').trigger('click')
    await wrapper.findAll('[role="option"]')[0]!.trigger('click')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')?.[1]?.[0]).toMatchObject({ recurrence: undefined })
  })

  it('requires a due date and at least one day for recurrence', async () => {
    const wrapper = mountEditor()
    await wrapper.get('button[aria-label="Clear due date"]').trigger('click')
    await wrapper.get('.select-dropdown__trigger').trigger('click')
    await wrapper.findAll('[role="option"]')[3]!.trigger('click')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('Choose a due date')
  })
})
