import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import axe from 'axe-core'
import TasksView from '@/views/TasksView.vue'
import { useTasksStore } from '@/stores/tasks'
import { useOrganizationStore } from '@/stores/organization'

const mountTasksView = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useTasksStore().initialize()
  useOrganizationStore().initialize()

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

    await wrapper.get('button[aria-label="Actions for Original task"]').trigger('click')
    await wrapper.findAll('button[role="menuitem"]')[0]!.trigger('click')
    await wrapper.get('input[name="editTitle"]').setValue('Updated task')
    const editForm = wrapper.get('form[aria-label="Edit task"]')
    await editForm.get('.date-picker__trigger').trigger('click')
    await editForm.get('button[aria-label="Wednesday, August 12, 2026"]').trigger('click')
    await editForm.trigger('submit')

    expect(store.tasks[0]).toMatchObject({ title: 'Updated task', dueTo: '2026-08-12' })
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('manages organization, assigns it, and composes filters', async () => {
    const wrapper = mountTasksView()
    const tasks = useTasksStore()
    const organization = useOrganizationStore()
    organization.replaceAll({
      version: 1,
      projects: [
        { id: 'project-1', name: 'Work' },
        { id: 'project-2', name: 'Home' },
      ],
      tags: [{ id: 'tag-1', name: 'Focus' }],
    })
    tasks.replaceAll([
      {
        id: 'one',
        title: 'Matching',
        completed: false,
        createdAt: '2026-08-01T08:00:00.000Z',
        projectId: 'project-1',
        tagIds: ['tag-1'],
      },
      {
        id: 'two',
        title: 'Wrong project',
        completed: false,
        createdAt: '2026-08-01T08:00:00.000Z',
        projectId: 'project-2',
        tagIds: ['tag-1'],
      },
      {
        id: 'three',
        title: 'Completed',
        completed: true,
        createdAt: '2026-08-01T08:00:00.000Z',
        projectId: 'project-1',
        tagIds: ['tag-1'],
      },
    ])
    await wrapper.vm.$nextTick()

    await wrapper.get('button[aria-label="Filter tasks"]').trigger('click')
    await wrapper.findAll('[role="option"]')[1]!.trigger('click')
    await wrapper.get('button[aria-label="Filter tasks by project"]').trigger('click')
    await wrapper.findAll('[role="option"]')[1]!.trigger('click')
    await wrapper.get('button[aria-label="Filter tasks by tag"]').trigger('click')
    await wrapper.findAll('[role="option"]')[1]!.trigger('click')

    expect(wrapper.text()).toContain('Matching')
    expect(wrapper.text()).not.toContain('Wrong project')
    expect(wrapper.text()).toContain('Active tasks, project Work, tag Focus')
  })

  it('opens a dialog before renaming organization metadata', async () => {
    const wrapper = mountTasksView()
    const organization = useOrganizationStore()
    organization.replaceAll({ version: 1, projects: [{ id: 'project-1', name: 'Work' }], tags: [] })
    await wrapper.vm.$nextTick()

    const panel = wrapper.getComponent({ name: 'TaskOrganizationPanel' })
    expect(panel.find('#organization-edit-name').exists()).toBe(false)
    await panel.get('li button').trigger('click')
    await panel.get('#organization-edit-name').setValue('Client work')
    await panel.get('#organization-edit-form').trigger('submit')

    expect(organization.projects[0]?.name).toBe('Client work')
    expect(panel.find('dialog').exists()).toBe(false)
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
