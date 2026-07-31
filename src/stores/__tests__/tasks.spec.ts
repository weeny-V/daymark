import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import type { Task } from '@/types/Task'
import { useSettingsStore } from '@/stores/settings'

const STORAGE_KEY = 'daymark.tasks'

const savedTask: Task = {
  id: 'saved-task',
  title: 'Review the daily plan',
  completed: false,
  createdAt: '2026-07-29T08:00:00.000Z',
}

const createStore = () => {
  setActivePinia(createPinia())
  return useTasksStore()
}

describe('task store', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds a task and updates progress counts', () => {
    const store = createStore()
    store.initialize()

    store.addTask({ title: 'Write release notes' })

    expect(store.tasks).toHaveLength(1)
    expect(store.tasks[0]).toMatchObject({
      title: 'Write release notes',
      completed: false,
      priority: 'medium',
    })
    expect(store.count).toEqual({ all: 1, active: 1, completed: 0 })
  })

  it('stores an optional due date on a new task', () => {
    const store = createStore()
    store.initialize()

    store.addTask({ title: 'Prepare the demo', dueTo: '2026-08-10' })

    expect(store.tasks[0]?.dueTo).toBe('2026-08-10')
  })

  it('updates a task title and due date and can remove the due date', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...savedTask, dueTo: '2026-08-10' }]))
    const store = createStore()
    store.initialize()

    expect(
      store.updateTask(savedTask.id, { title: 'Plan the daily review', dueTo: '2026-08-12' }),
    ).toBe(true)
    expect(store.tasks[0]).toMatchObject({
      title: 'Plan the daily review',
      dueTo: '2026-08-12',
    })

    expect(store.updateTask(savedTask.id, { dueTo: undefined })).toBe(true)
    expect(store.tasks[0]).not.toHaveProperty('dueTo')
  })

  it('rejects invalid task updates without changing the task', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([savedTask]))
    const store = createStore()
    store.initialize()

    expect(store.updateTask(savedTask.id, { title: '   ' })).toBe(false)
    expect(
      store.updateTask(savedTask.id, { title: 'Should not be saved', dueTo: '2026-02-31' }),
    ).toBe(false)
    expect(store.tasks[0]).toEqual(savedTask)
  })

  it('groups active scheduled tasks around the current local day in due-date order', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 31, 23, 59, 59))
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { ...savedTask, id: 'later-2', dueTo: '2026-08-02' },
        { ...savedTask, id: 'overdue', dueTo: '2026-07-30' },
        { ...savedTask, id: 'today', dueTo: '2026-07-31' },
        { ...savedTask, id: 'later-1', dueTo: '2026-08-01' },
        { ...savedTask, id: 'completed', dueTo: '2026-07-30', completed: true },
        { ...savedTask, id: 'unscheduled' },
      ]),
    )
    const store = createStore()
    store.initialize()

    expect(store.upcoming.overdue.map((task) => task.id)).toEqual(['overdue'])
    expect(store.upcoming.today.map((task) => task.id)).toEqual(['today'])
    expect(store.upcoming.later.map((task) => task.id)).toEqual(['later-1', 'later-2'])
  })

  it('uses the current default priority only for newly created tasks', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([savedTask]))
    const store = createStore()
    store.initialize()
    useSettingsStore().defaultTaskPriority = 'high'

    store.addTask({ title: 'Plan the next release' })

    expect(store.tasks[0]).toEqual(savedTask)
    expect(store.tasks[1]?.priority).toBe('high')
  })

  it('toggles and deletes tasks through store actions', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([savedTask]))
    const store = createStore()
    store.initialize()

    store.toggleTask(savedTask.id)
    expect(store.tasks[0]?.completed).toBe(true)
    expect(store.count).toEqual({ all: 1, active: 0, completed: 1 })

    store.deleteTask(savedTask.id)
    expect(store.tasks).toEqual([])
    expect(store.count).toEqual({ all: 0, active: 0, completed: 0 })
  })

  it('shows tasks matching the selected filter', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([savedTask, { ...savedTask, id: 'completed-task', completed: true }]),
    )
    const store = createStore()
    store.initialize()

    store.selectedFilter = 'active'
    expect(store.filteredTasks.map((task) => task.id)).toEqual(['saved-task'])

    store.selectedFilter = 'completed'
    expect(store.filteredTasks.map((task) => task.id)).toEqual(['completed-task'])

    store.selectedFilter = 'all'
    expect(store.filteredTasks).toHaveLength(2)
  })

  it('loads saved tasks and persists later changes', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([savedTask]))
    const store = createStore()

    store.initialize()
    store.toggleTask(savedTask.id)
    await nextTick()

    expect(store.tasks).toEqual([{ ...savedTask, completed: true }])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([
      { ...savedTask, completed: true },
    ])
  })

  it('recovers from malformed stored data without crashing', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    localStorage.setItem(STORAGE_KEY, '{not valid json')
    const store = createStore()

    expect(() => store.initialize()).not.toThrow()
    expect(store.tasks).toEqual([])
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('Unable to read or parse stored data'),
      expect.any(SyntaxError),
    )
  })

  it('ignores repeated initialization calls', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([savedTask]))
    const store = createStore()
    store.initialize()

    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    store.initialize()

    expect(store.tasks).toEqual([savedTask])
  })
})
