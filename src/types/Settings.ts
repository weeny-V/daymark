import type { TaskPriority } from './Task'

export type ThemePreference = 'light' | 'dark' | 'system'
export type DateFormat = 'MMMM D, YYYY' | 'D MMMM YYYY' | 'YYYY-MM-DD'
export type WeekStartsOn = 0 | 1

export type Settings = {
  version: 1
  theme: ThemePreference
  dateFormat: DateFormat
  weekStartsOn: WeekStartsOn
  defaultTaskPriority: TaskPriority
}
