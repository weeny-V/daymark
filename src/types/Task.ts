export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  title: string
  completed: boolean
  id: string
  createdAt: string
  priority?: TaskPriority
}

export type TaskFilter = 'all' | 'active' | 'completed'
