export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskRecurrence =
  | { type: 'daily' }
  | { type: 'weekly' }
  | { type: 'weekdays'; weekdays: number[] }

export type Task = {
  title: string
  completed: boolean
  id: string
  createdAt: string
  priority?: TaskPriority
  dueTo?: string
  projectId?: string
  tagIds?: string[]
  recurrence?: TaskRecurrence
  generatedFromTaskId?: string
}

export type TaskChanges = {
  title?: string
  dueTo?: string
  projectId?: string
  tagIds?: string[]
  recurrence?: TaskRecurrence
}

export type TaskFilter = 'all' | 'active' | 'completed'
