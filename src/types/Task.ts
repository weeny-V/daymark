export type Task = {
  title: string
  completed: boolean
  id: string
  createdAt: string
}

export type TaskFilter = 'all' | 'active' | 'completed'
