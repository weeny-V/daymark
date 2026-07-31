import { defineStore } from 'pinia'
import type { Task, TaskChanges, TaskFilter, TaskPriority, TaskRecurrence } from '@/types/Task.ts'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage.ts'
import { computed, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useOrganizationStore } from '@/stores/organization'
import dayjs from 'dayjs'
import { compareDateStrings } from '@/shared/utils/date.ts'

const TASKS_STORAGE_KEY = 'daymark.tasks'
const taskPriorities: TaskPriority[] = ['low', 'medium', 'high']
const isRecurrence = (value: unknown): value is TaskRecurrence => {
  if (typeof value !== 'object' || value === null) return false
  const recurrence = value as Record<string, unknown>
  if (recurrence.type === 'daily' || recurrence.type === 'weekly') return true
  return (
    recurrence.type === 'weekdays' &&
    Array.isArray(recurrence.weekdays) &&
    recurrence.weekdays.length > 0 &&
    recurrence.weekdays.every(
      (day) => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6,
    ) &&
    new Set(recurrence.weekdays).size === recurrence.weekdays.length
  )
}
const copyRecurrence = (recurrence: TaskRecurrence): TaskRecurrence =>
  recurrence.type === 'weekdays'
    ? { type: 'weekdays', weekdays: [...recurrence.weekdays] }
    : { type: recurrence.type }
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
    (task.recurrence === undefined || (isRecurrence(task.recurrence) && isDateOnly(task.dueTo))) &&
    (task.generatedFromTaskId === undefined || typeof task.generatedFromTaskId === 'string') &&
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

  const addTask = ({
    title,
    dueTo,
    recurrence,
  }: {
    title: string
    dueTo?: string
    recurrence?: TaskRecurrence
  }) => {
    const normalizedTitle = title.trim()
    if (
      !normalizedTitle ||
      (dueTo && !isDateOnly(dueTo)) ||
      (recurrence && (!isRecurrence(recurrence) || !dueTo))
    )
      return false

    const settingsStore = useSettingsStore()
    const newTask: Task = {
      title: normalizedTitle,
      completed: false,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      priority: settingsStore.defaultTaskPriority,
      ...(dueTo ? { dueTo } : {}),
      ...(recurrence ? { recurrence: copyRecurrence(recurrence) } : {}),
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
    if (
      changes.recurrence &&
      (!isRecurrence(changes.recurrence) || !(changes.dueTo ?? task.dueTo))
    ) {
      return false
    }
    if (
      Object.hasOwn(changes, 'dueTo') &&
      !changes.dueTo &&
      (changes.recurrence ?? task.recurrence)
    ) {
      return false
    }

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
    if (Object.hasOwn(changes, 'recurrence')) {
      if (changes.recurrence) task.recurrence = copyRecurrence(changes.recurrence)
      else delete task.recurrence
    }

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

  const nextDueDate = (dueTo: string, recurrence: TaskRecurrence) => {
    const dueDate = dayjs(dueTo)
    if (recurrence.type === 'daily') return dueDate.add(1, 'day').format('YYYY-MM-DD')
    if (recurrence.type === 'weekly') return dueDate.add(1, 'week').format('YYYY-MM-DD')

    for (let offset = 1; offset <= 7; offset += 1) {
      const candidate = dueDate.add(offset, 'day')
      if (recurrence.weekdays.includes(candidate.day())) return candidate.format('YYYY-MM-DD')
    }
    return dueTo
  }

  const toggleTask = (id: string) => {
    const task = tasks.value.find((task) => task.id === id)
    if (!task) return

    const completing = !task.completed
    task.completed = completing
    if (
      completing &&
      task.recurrence &&
      task.dueTo &&
      !tasks.value.some((candidate) => candidate.generatedFromTaskId === task.id)
    ) {
      tasks.value.push({
        ...task,
        id: crypto.randomUUID(),
        completed: false,
        createdAt: new Date().toISOString(),
        dueTo: nextDueDate(task.dueTo, task.recurrence),
        generatedFromTaskId: task.id,
        recurrence: copyRecurrence(task.recurrence),
        ...(task.tagIds ? { tagIds: [...task.tagIds] } : {}),
      })
    }
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
