import { defineStore } from 'pinia'
import type { Task, TaskChanges, TaskFilter, TaskPriority } from '@/types/Task.ts'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage.ts'
import { computed, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useOrganizationStore } from '@/stores/organization'
import dayjs from 'dayjs'
import { compareDateStrings } from '@/shared/utils/date.ts'

const TASKS_STORAGE_KEY = 'daymark.tasks'
const taskPriorities: TaskPriority[] = ['low', 'medium', 'high']
const isDateOnly = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  dayjs(value).isValid() &&
  dayjs(value).format('YYYY-MM-DD') === value

const isTask = (value: unknown): value is Task => {
  if (typeof value !== 'object' || value === null) return false

  const task = value as Record<string, unknown>

  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.createdAt === 'string' &&
    !Number.isNaN(Date.parse(task.createdAt)) &&
    (task.priority === undefined || taskPriorities.includes(task.priority as TaskPriority)) &&
    (task.dueTo === undefined || isDateOnly(task.dueTo)) &&
    (task.projectId === undefined || typeof task.projectId === 'string') &&
    (task.tagIds === undefined ||
      (Array.isArray(task.tagIds) &&
        task.tagIds.every((id) => typeof id === 'string') &&
        new Set(task.tagIds).size === task.tagIds.length))
  )
}

export const isTaskList = (value: unknown): value is Task[] =>
  Array.isArray(value) && value.every(isTask)

export const useTasksStore = defineStore('tasks', () => {
  const storage = useLocalStorage<Task[]>({
    key: TASKS_STORAGE_KEY,
    fallback: () => [],
    validate: isTaskList,
  })
  const tasks = ref<Task[]>([])
  const selectedFilter = ref<TaskFilter>('all')
  let initialized = false

  const initialize = () => {
    if (initialized) return

    tasks.value = storage.get()
    watch(tasks, (value) => storage.set(value), { deep: true })
    initialized = true
  }

  const organizationFilteredTasks = computed(() => {
    const settings = useOrganizationStore()
    let result = tasks.value
    if (settings.selectedProjectId !== 'all') {
      result = result.filter((task) => task.projectId === settings.selectedProjectId)
    }
    if (settings.selectedTagId !== 'all') {
      result = result.filter((task) => task.tagIds?.includes(settings.selectedTagId))
    }
    return result
  })

  const filteredTasks = computed(() => {
    if (selectedFilter.value === 'active') {
      return organizationFilteredTasks.value.filter((task) => !task.completed)
    }
    if (selectedFilter.value === 'completed') {
      return organizationFilteredTasks.value.filter((task) => task.completed)
    }
    return organizationFilteredTasks.value
  })

  const addTask = ({ title, dueTo }: { title: string; dueTo?: string }) => {
    const normalizedTitle = title.trim()
    if (!normalizedTitle || (dueTo && !isDateOnly(dueTo))) return false

    const settingsStore = useSettingsStore()
    const newTask: Task = {
      title: normalizedTitle,
      completed: false,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      priority: settingsStore.defaultTaskPriority,
      ...(dueTo ? { dueTo } : {}),
    }
    tasks.value.push(newTask)
    return true
  }

  const updateTask = (id: string, changes: TaskChanges) => {
    const task = tasks.value.find((item) => item.id === id)
    if (!task) return false

    const normalizedTitle = changes.title?.trim()
    if (changes.title !== undefined && !normalizedTitle) return false
    if (changes.dueTo && !isDateOnly(changes.dueTo)) return false

    if (normalizedTitle !== undefined) task.title = normalizedTitle

    if (Object.hasOwn(changes, 'dueTo')) {
      if (changes.dueTo) task.dueTo = changes.dueTo
      else delete task.dueTo
    }
    if (Object.hasOwn(changes, 'projectId')) {
      if (changes.projectId) task.projectId = changes.projectId
      else delete task.projectId
    }
    if (changes.tagIds !== undefined) task.tagIds = [...new Set(changes.tagIds)]

    return true
  }

  const deleteTask = (id: string) => {
    tasks.value = tasks.value.filter((task) => task.id !== id)
  }

  const replaceAll = (value: Task[]) => {
    tasks.value = structuredClone(value)
  }

  const clearProject = (id: string) => {
    tasks.value.forEach((task) => {
      if (task.projectId === id) delete task.projectId
    })
  }

  const clearTag = (id: string) => {
    tasks.value.forEach((task) => {
      if (task.tagIds?.includes(id)) task.tagIds = task.tagIds.filter((tagId) => tagId !== id)
    })
  }

  const toggleTask = (id: string) => {
    const task = tasks.value.find((task) => task.id === id)
    if (task) task.completed = !task.completed
  }

  const count = computed(() => ({
    all: organizationFilteredTasks.value.length,
    active: organizationFilteredTasks.value.filter((task) => !task.completed).length,
    completed: organizationFilteredTasks.value.filter((task) => task.completed).length,
  }))

  const upcoming = computed(() => {
    const sortedTasks = tasks.value
      .filter((task) => task.dueTo && !task.completed)
      .sort((a, b) => dayjs(a.dueTo).valueOf() - dayjs(b.dueTo).valueOf())

    return {
      overdue: sortedTasks.filter((task) => compareDateStrings(task.dueTo!) < 0),
      today: sortedTasks.filter((task) => compareDateStrings(task.dueTo!) === 0),
      later: sortedTasks.filter((task) => compareDateStrings(task.dueTo!) > 0),
    }
  })

  return {
    addTask,
    count,
    clearProject,
    clearTag,
    deleteTask,
    filteredTasks,
    initialize,
    replaceAll,
    tasks,
    toggleTask,
    updateTask,
    selectedFilter,
    upcoming,
  }
})
