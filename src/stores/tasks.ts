import { defineStore } from 'pinia'
import type { Subtask, Task, TaskChanges, TaskFilter, TaskPriority } from '@/types/Task.ts'
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

const isSubtask = (value: unknown): value is Subtask => {
  if (typeof value !== 'object' || value === null) return false
  const subtask = value as Record<string, unknown>
  return (
    typeof subtask.id === 'string' &&
    typeof subtask.title === 'string' &&
    !!subtask.title.trim() &&
    typeof subtask.completed === 'boolean' &&
    typeof subtask.createdAt === 'string' &&
    !Number.isNaN(Date.parse(subtask.createdAt)) &&
    typeof subtask.order === 'number' &&
    Number.isFinite(subtask.order)
  )
}

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
        new Set(task.tagIds).size === task.tagIds.length)) &&
    (task.order === undefined || (typeof task.order === 'number' && Number.isFinite(task.order))) &&
    (task.subtasks === undefined ||
      (Array.isArray(task.subtasks) &&
        task.subtasks.every(isSubtask) &&
        new Set(task.subtasks.map((subtask) => subtask.id)).size === task.subtasks.length))
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
  const normalizeTasks = (value: Task[]) =>
    value.map((task, index) => ({
      ...structuredClone(task),
      order: task.order ?? (index + 1) * 1000,
      subtasks: [...(task.subtasks ?? [])].sort((a, b) => a.order - b.order),
    }))

  const initialize = () => {
    if (initialized) return

    tasks.value = normalizeTasks(storage.get())
    storage.set(tasks.value)
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
    return [...result].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
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
      order: Math.max(0, ...tasks.value.map((task) => task.order ?? 0)) + 1000,
      subtasks: [],
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

  const moveByOrder = <T extends { id: string; order: number }>(
    items: T[],
    id: string,
    direction: 'up' | 'down',
  ) => {
    const ordered = [...items].sort((a, b) => a.order - b.order)
    const index = ordered.findIndex((item) => item.id === id)
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return false
    const current = ordered[index]!
    const target = ordered[targetIndex]!
    ;[current.order, target.order] = [target.order, current.order]
    return true
  }

  const moveTask = (id: string, direction: 'up' | 'down', scopeIds?: string[]) => {
    const scope = scopeIds ? tasks.value.filter((task) => scopeIds.includes(task.id)) : tasks.value
    return moveByOrder(scope as (Task & { order: number })[], id, direction)
  }

  const addSubtask = (taskId: string, title: string) => {
    const task = tasks.value.find((item) => item.id === taskId)
    const normalized = title.trim()
    if (!task || !normalized) return false
    const subtasks = (task.subtasks ??= [])
    subtasks.push({
      id: crypto.randomUUID(),
      title: normalized,
      completed: false,
      createdAt: new Date().toISOString(),
      order: Math.max(0, ...subtasks.map((subtask) => subtask.order)) + 1000,
    })
    return true
  }

  const updateSubtask = (taskId: string, subtaskId: string, title: string) => {
    const subtask = tasks.value
      .find((task) => task.id === taskId)
      ?.subtasks?.find((item) => item.id === subtaskId)
    const normalized = title.trim()
    if (!subtask || !normalized) return false
    subtask.title = normalized
    return true
  }

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const subtask = tasks.value
      .find((task) => task.id === taskId)
      ?.subtasks?.find((item) => item.id === subtaskId)
    if (!subtask) return false
    subtask.completed = !subtask.completed
    return true
  }

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.value.find((item) => item.id === taskId)
    if (!task?.subtasks?.some((subtask) => subtask.id === subtaskId)) return false
    task.subtasks = task.subtasks.filter((subtask) => subtask.id !== subtaskId)
    return true
  }

  const moveSubtask = (taskId: string, subtaskId: string, direction: 'up' | 'down') => {
    const subtasks = tasks.value.find((task) => task.id === taskId)?.subtasks
    return subtasks ? moveByOrder(subtasks, subtaskId, direction) : false
  }

  const replaceAll = (value: Task[]) => {
    tasks.value = normalizeTasks(value)
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
    if (!task || (!task.completed && task.subtasks?.some((subtask) => !subtask.completed))) {
      return false
    }
    task.completed = !task.completed
    return true
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
    addSubtask,
    count,
    clearProject,
    clearTag,
    deleteTask,
    deleteSubtask,
    filteredTasks,
    initialize,
    replaceAll,
    moveTask,
    moveSubtask,
    tasks,
    toggleTask,
    toggleSubtask,
    updateTask,
    updateSubtask,
    selectedFilter,
    upcoming,
  }
})
