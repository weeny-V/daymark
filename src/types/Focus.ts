export type FocusMode = 'focus' | 'break'
export type TimerStatus = 'idle' | 'running' | 'paused'

export interface FocusSession {
  id: string
  mode: FocusMode
  startedAt: string
  completedAt: string
  durationSeconds: number
  taskId?: string
}

export interface FocusTimerState {
  status: TimerStatus
  mode: FocusMode
  focusMinutes: number
  breakMinutes: number
  remainingSeconds: number
  startedAt?: string
  endsAt?: string
  taskId?: string
}

export interface FocusData {
  timer: FocusTimerState
  sessions: FocusSession[]
  soundEnabled?: boolean
}
