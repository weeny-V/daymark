export type HabitSchedule =
  | { type: 'daily' }
  | { type: 'weekdays'; weekdays: number[] }

export interface Habit {
  id: string
  name: string
  schedule: HabitSchedule
  completedDates: string[]
  createdAt: string
}

export type HabitInput = Pick<Habit, 'name' | 'schedule'>

