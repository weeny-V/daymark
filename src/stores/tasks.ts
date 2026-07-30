import {defineStore} from "pinia";
import type {Task, TaskFilter, TaskPriority} from "@/types/Task.ts";
import {useLocalStorage} from "@/shared/hooks/useLocalStorage.ts";
import {computed, ref, watch} from "vue";
import { useSettingsStore } from '@/stores/settings'

const TASKS_STORAGE_KEY = 'daymark.tasks'
const taskPriorities: TaskPriority[] = ['low', 'medium', 'high']

const isTask = (value: unknown): value is Task => {
  if (typeof value !== 'object' || value === null) return false

  const task = value as Record<string, unknown>

  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.createdAt === 'string' &&
    !Number.isNaN(Date.parse(task.createdAt)) &&
    (task.priority === undefined || taskPriorities.includes(task.priority as TaskPriority))
  )
}

const isTaskList = (value: unknown): value is Task[] =>
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

  const filteredTasks = computed(() => {
    if (selectedFilter.value === 'active') {
      return tasks.value.filter((task) => !task.completed)
    }

    if (selectedFilter.value === 'completed') {
      return tasks.value.filter((task) => task.completed)
    }

    return tasks.value
  })

  const addTask = ({ title }: { title: string }) => {
    const settingsStore = useSettingsStore()
    const newTask: Task = {
      title,
      completed: false,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      priority: settingsStore.defaultTaskPriority,
    }
    tasks.value.push(newTask)
  }

  const deleteTask = (id: string) => {
    tasks.value = tasks.value.filter((task) => task.id !== id)
  }

  const toggleTask = (id: string) => {
    const task = tasks.value.find((task) => task.id === id)
    if (task) task.completed = !task.completed
  }

  const count = computed(() => ({
    all: tasks.value.length,
    active: tasks.value.filter((task) => !task.completed).length,
    completed: tasks.value.filter((task) => task.completed).length,
  }))

  return {
    addTask,
    count,
    deleteTask,
    filteredTasks,
    initialize,
    tasks,
    toggleTask,
    selectedFilter,
  }
});
