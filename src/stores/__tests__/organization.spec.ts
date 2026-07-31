import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOrganizationStore } from '@/stores/organization'
import { useTasksStore } from '@/stores/tasks'

describe('organization store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useTasksStore().initialize()
    useOrganizationStore().initialize()
  })

  it('creates and renames unique projects and tags', () => {
    const store = useOrganizationStore()
    expect(store.addProject('Work')).toBe(true)
    expect(store.addProject(' work ')).toBe(false)
    expect(store.addTag('Deep work')).toBe(true)

    expect(store.renameProject(store.projects[0]!.id, 'Client work')).toBe(true)
    expect(store.projects[0]?.name).toBe('Client work')
    expect(store.tags[0]?.name).toBe('Deep work')
  })

  it('detaches deleted metadata without deleting tasks', () => {
    const organization = useOrganizationStore()
    const tasks = useTasksStore()
    organization.replaceAll({
      version: 1,
      projects: [{ id: 'project-1', name: 'Work' }],
      tags: [{ id: 'tag-1', name: 'Urgent' }],
    })
    tasks.replaceAll([
      {
        id: 'task-1',
        title: 'Keep this task',
        completed: false,
        createdAt: '2026-08-01T08:00:00.000Z',
        projectId: 'project-1',
        tagIds: ['tag-1'],
      },
    ])

    organization.deleteProject('project-1')
    organization.deleteTag('tag-1')

    expect(tasks.tasks).toHaveLength(1)
    expect(tasks.tasks[0]).not.toHaveProperty('projectId')
    expect(tasks.tasks[0]?.tagIds).toEqual([])
  })

  it('loads existing tasks without organization fields', () => {
    localStorage.setItem(
      'daymark.tasks',
      JSON.stringify([
        {
          id: 'old',
          title: 'Existing task',
          completed: false,
          createdAt: '2026-08-01T08:00:00.000Z',
        },
      ]),
    )
    const pinia = createPinia()
    setActivePinia(pinia)
    const tasks = useTasksStore(pinia)
    tasks.initialize()
    expect(tasks.tasks[0]?.title).toBe('Existing task')
  })
})
