export type TaskPriority = 'low' | 'medium' | 'high'

export type Subtask = {
  id: string
  title: string
  completed: boolean
  createdAt: string
  order: number
}

export type Task = {
  title: string
  completed: boolean
  id: string
  createdAt: string
  priority?: TaskPriority
  dueTo?: string
  projectId?: string
  tagIds?: string[]
  order?: number
  subtasks?: Subtask[]
}

export type TaskChanges = {
  title?: string
  dueTo?: string
  projectId?: string
  tagIds?: string[]
}

export type TaskFilter = 'all' | 'active' | 'completed'
