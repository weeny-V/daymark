import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createBackup, parseBackup, restoreBackup } from '@/shared/utils/backup'
import { useTasksStore } from '@/stores/tasks'
import { useSettingsStore } from '@/stores/settings'
import { useNotesStore } from '@/stores/notes'
import { useHabitsStore } from '@/stores/habits'
import { useOrganizationStore } from '@/stores/organization'

const initializeStores = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useSettingsStore(pinia).initialize()
  useOrganizationStore(pinia).initialize()
  useTasksStore(pinia).initialize()
  useNotesStore(pinia).initialize()
  useHabitsStore(pinia).initialize()
  return pinia
}

describe('JSON backups', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips equivalent application state', () => {
    const pinia = initializeStores()
    const tasks = useTasksStore(pinia)
    const settings = useSettingsStore(pinia)
    const notes = useNotesStore(pinia)
    const habits = useHabitsStore(pinia)
    const organization = useOrganizationStore(pinia)

    tasks.replaceAll([
      {
        id: 'task-1',
        title: 'Ship backup',
        completed: false,
        createdAt: '2026-08-01T08:00:00.000Z',
        priority: 'high',
      },
    ])
    settings.theme = 'dark'
    notes.replaceAll([
      {
        id: 'note-1',
        title: 'Backup notes',
        body: 'Remember validation.',
        pinned: true,
        linkedTaskIds: ['task-1'],
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
    ])
    habits.replaceAll([
      {
        id: 'habit-1',
        name: 'Review backups',
        schedule: { type: 'daily' },
        completedDates: ['2026-08-01'],
        createdAt: '2026-08-01T08:00:00.000Z',
      },
    ])
    organization.replaceAll({
      version: 1,
      projects: [{ id: 'project-1', name: 'Daymark' }],
      tags: [{ id: 'tag-1', name: 'Release' }],
    })
    tasks.updateTask('task-1', { projectId: 'project-1', tagIds: ['tag-1'] })

    const source = JSON.stringify(createBackup(pinia, '2026-08-01T09:00:00.000Z'))
    tasks.replaceAll([])
    settings.reset()
    notes.replaceAll([])
    habits.replaceAll([])
    organization.replaceAll({ version: 1, projects: [], tags: [] })

    restoreBackup(pinia, parseBackup(source))

    expect(tasks.tasks).toHaveLength(1)
    expect(settings.theme).toBe('dark')
    expect(notes.notes[0]?.linkedTaskIds).toEqual(['task-1'])
    expect(habits.habits[0]?.completedDates).toEqual(['2026-08-01'])
    expect(organization.projects[0]?.name).toBe('Daymark')
    expect(tasks.tasks[0]?.tagIds).toEqual(['tag-1'])
  })

  it.each([
    ['malformed JSON', '{'],
    [
      'unsupported version',
      JSON.stringify({ version: 3, exportedAt: '2026-08-01T09:00:00.000Z', data: {} }),
    ],
    [
      'partial data',
      JSON.stringify({
        version: 1,
        exportedAt: '2026-08-01T09:00:00.000Z',
        data: { tasks: [], settings: {}, notes: [] },
      }),
    ],
  ])('rejects %s without changing application state', (_label, source) => {
    const pinia = initializeStores()
    const tasks = useTasksStore(pinia)
    tasks.replaceAll([
      {
        id: 'existing',
        title: 'Keep me',
        completed: false,
        createdAt: '2026-08-01T08:00:00.000Z',
      },
    ])

    expect(() => parseBackup(source)).toThrow()
    expect(tasks.tasks.map((task) => task.id)).toEqual(['existing'])
  })
})
