import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AppTaskItem from '@/components/tasks/AppTaskItem.vue'
import type { Task } from '@/types/Task'
import { useTasksStore } from '@/stores/tasks'

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

    await wrapper.get(`button[aria-label="Actions for ${task.title}"]`).trigger('click')
    await wrapper.findAll('button[role="menuitem"]')[1]!.trigger('click')

    expect(wrapper.emitted('delete')).toEqual([[task.id]])
  })

  it('requests editing for the selected task', async () => {
    const wrapper = mountTaskItem()

    await wrapper.get(`button[aria-label="Actions for ${task.title}"]`).trigger('click')
    await wrapper.findAll('button[role="menuitem"]')[0]!.trigger('click')

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

  it('shows the completion rule and keyboard-operable drag handles', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const taskWithSubtask: Task = {
      ...task,
      order: 1000,
      subtasks: [
        {
          id: 'subtask-1',
          title: 'Draft outline',
          completed: false,
          createdAt: '2026-08-01T08:00:00.000Z',
          order: 1000,
        },
      ],
    }
    const wrapper = mount(AppTaskItem, {
      props: { task: taskWithSubtask, manageSubtasks: true, canMoveDown: true },
      global: { plugins: [pinia] },
    })

    expect(wrapper.get('.task-item__checkbox').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Complete all 1 active subtasks')
    const taskHandle = wrapper.get(
      `button[aria-label="Reorder ${task.title}. Use arrow keys to move."]`,
    )
    expect(taskHandle.attributes('draggable')).toBe('true')
    const setDragImage = vi.fn()
    await taskHandle.trigger('dragstart', {
      dataTransfer: { setData: vi.fn(), setDragImage, effectAllowed: '' },
    })
    const preview = setDragImage.mock.calls[0]?.[0] as HTMLElement
    expect(preview.className).toBe('task-drag-preview')
    expect(preview.textContent).toContain(task.title)
    expect(preview.style.background).toContain('linear-gradient')
    await taskHandle.trigger('dragend')
    await taskHandle.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('move')).toEqual([[task.id, 'down']])
    expect(
      wrapper
        .get('button[aria-label="Reorder Draft outline. Use arrow keys to move."]')
        .attributes('draggable'),
    ).toBe('true')
  })

  it('shows a subtask as text until Edit opens a dialog', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useTasksStore()
    store.replaceAll([
      {
        ...task,
        subtasks: [
          {
            id: 'subtask-1',
            title: 'Draft outline',
            completed: false,
            createdAt: '2026-08-01T08:00:00.000Z',
            order: 1000,
          },
        ],
      },
    ])
    const wrapper = mount(AppTaskItem, {
      props: { task: store.tasks[0]!, manageSubtasks: true },
      global: { plugins: [pinia] },
    })

    expect(wrapper.find('#subtask-subtask-1').exists()).toBe(false)
    const editButton = wrapper.get('button[aria-label="Edit Draft outline"]')
    expect(editButton.find('svg').exists()).toBe(true)
    expect(editButton.text()).toBe('')
    await editButton.trigger('click')
    await wrapper.get('#subtask-edit-title').setValue('Draft agenda')
    await wrapper.get('#subtask-edit-form').trigger('submit')

    expect(store.tasks[0]?.subtasks?.[0]?.title).toBe('Draft agenda')
    expect(wrapper.get('dialog').classes()).toContain('app-dialog--closing')
    await new Promise((resolve) => window.setTimeout(resolve, 240))
    expect(wrapper.get('dialog').attributes()).not.toHaveProperty('open')
  })

  it('shows and applies an exact drag insertion position', async () => {
    const wrapper = mountTaskItem()
    vi.spyOn(wrapper.element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 100,
    } as DOMRect)

    await wrapper.trigger('dragover', {
      clientY: 75,
      dataTransfer: { types: ['text/task-id'] },
    })
    expect(wrapper.classes()).toContain('task-item--drop-after')

    await wrapper.trigger('drop', {
      dataTransfer: { getData: () => 'task-2' },
    })
    expect(wrapper.emitted('reorder')).toEqual([['task-2', task.id, 'after']])
    expect(wrapper.classes()).not.toContain('task-item--drop-after')
  })

  it('auto-scrolls near the viewport edge while dragging', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(AppTaskItem, {
      props: { task, manageSubtasks: true },
      global: { plugins: [pinia] },
    })
    const handle = wrapper.get(`button[aria-label="Reorder ${task.title}. Use arrow keys to move."]`)
    let scrollFrame: FrameRequestCallback | undefined
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        scrollFrame = callback
        return 1
      })
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})

    await handle.trigger('dragstart', {
      dataTransfer: { setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: '' },
    })
    const dragOver = new Event('dragover')
    Object.defineProperty(dragOver, 'clientY', { value: window.innerHeight - 1 })
    document.dispatchEvent(dragOver)
    expect(requestFrame).toHaveBeenCalled()
    scrollFrame?.(0)
    expect(scrollBy).toHaveBeenCalledWith(0, expect.any(Number))

    await handle.trigger('dragend')
    expect(cancelFrame).toHaveBeenCalled()
  })
})
