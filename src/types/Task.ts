export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  title: string
  completed: boolean
  id: string
  createdAt: string
  priority?: TaskPriority
  dueTo?: string
  projectId?: string
  tagIds?: string[]
}

export type TaskChanges = {
  title?: string
  dueTo?: string
  projectId?: string
  tagIds?: string[]
}

export type TaskFilter = 'all' | 'active' | 'completed'
