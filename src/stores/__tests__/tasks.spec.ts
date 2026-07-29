import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import type { Task } from '@/types/Task'

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

  it('adds a task and updates progress counts', () => {
    const store = createStore()
    store.initialize()

    store.addTask({ title: 'Write release notes' })

    expect(store.tasks).toHaveLength(1)
    expect(store.tasks[0]).toMatchObject({
      title: 'Write release notes',
      completed: false,
    })
    expect(store.count).toEqual({ all: 1, active: 1, completed: 0 })
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
