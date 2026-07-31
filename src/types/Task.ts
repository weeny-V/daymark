export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  title: string
  completed: boolean
  id: string
  createdAt: string
  priority?: TaskPriority
  dueTo?: string
}

export type TaskChanges = {
  title?: string
  dueTo?: string
}

export type TaskFilter = 'all' | 'active' | 'completed'
