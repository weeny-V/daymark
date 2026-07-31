import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import type { FocusData, FocusMode, FocusSession, FocusTimerState } from '@/types/Focus'

const STORAGE_KEY = 'daymark.focus'
const MIN_DURATION = 1
const MAX_DURATION = 180

const defaultTimer = (): FocusTimerState => ({
  status: 'idle',
  mode: 'focus',
  focusMinutes: 25,
  breakMinutes: 5,
  remainingSeconds: 25 * 60,
})

export const createEmptyFocusData = (): FocusData => ({ timer: defaultTimer(), sessions: [] })

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString() === value

const isDuration = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= MIN_DURATION && Number(value) <= MAX_DURATION

const isSession = (value: unknown): value is FocusSession => {
  if (typeof value !== 'object' || value === null) return false
  const session = value as Record<string, unknown>
  return (
    typeof session.id === 'string' &&
    (session.mode === 'focus' || session.mode === 'break') &&
    isIsoDate(session.startedAt) &&
    isIsoDate(session.completedAt) &&
    Number.isInteger(session.durationSeconds) &&
    Number(session.durationSeconds) > 0 &&
    (session.taskId === undefined || typeof session.taskId === 'string')
  )
}

const isTimer = (value: unknown): value is FocusTimerState => {
  if (typeof value !== 'object' || value === null) return false
  const timer = value as Record<string, unknown>
  return (
    (timer.status === 'idle' || timer.status === 'running' || timer.status === 'paused') &&
    (timer.mode === 'focus' || timer.mode === 'break') &&
    isDuration(timer.focusMinutes) &&
    isDuration(timer.breakMinutes) &&
    Number.isInteger(timer.remainingSeconds) &&
    Number(timer.remainingSeconds) >= 0 &&
    (timer.startedAt === undefined || isIsoDate(timer.startedAt)) &&
    (timer.endsAt === undefined || isIsoDate(timer.endsAt)) &&
    (timer.taskId === undefined || typeof timer.taskId === 'string') &&
    (timer.status !== 'running' || (isIsoDate(timer.startedAt) && isIsoDate(timer.endsAt)))
  )
}

export const isFocusData = (value: unknown): value is FocusData => {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Record<string, unknown>
  return isTimer(data.timer) && Array.isArray(data.sessions) && data.sessions.every(isSession)
}

export const useFocusStore = defineStore('focus', () => {
  const storage = useLocalStorage<FocusData>({
    key: STORAGE_KEY,
    fallback: createEmptyFocusData,
    validate: isFocusData,
  })
  const timer = ref<FocusTimerState>(defaultTimer())
  const sessions = ref<FocusSession[]>([])
  let initialized = false

  const durationSeconds = computed(
    () => (timer.value.mode === 'focus' ? timer.value.focusMinutes : timer.value.breakMinutes) * 60,
  )

  const persistable = computed<FocusData>(() => ({ timer: timer.value, sessions: sessions.value }))

  const initialize = () => {
    if (initialized) return
    const saved = storage.get()
    timer.value = saved.timer
    sessions.value = saved.sessions
    watch(persistable, (value) => storage.set(value), { deep: true })
    initialized = true
    tick()
  }

  const setDurations = (focusMinutes: number, breakMinutes: number) => {
    if (!isDuration(focusMinutes) || !isDuration(breakMinutes) || timer.value.status !== 'idle') {
      return false
    }
    timer.value.focusMinutes = focusMinutes
    timer.value.breakMinutes = breakMinutes
    timer.value.remainingSeconds = durationSeconds.value
    return true
  }

  const setMode = (mode: FocusMode) => {
    if (timer.value.status !== 'idle') return false
    timer.value.mode = mode
    timer.value.remainingSeconds = durationSeconds.value
    delete timer.value.taskId
    return true
  }

  const start = (taskId?: string, now = Date.now()) => {
    if (timer.value.status !== 'idle') return false
    const startedAt = new Date(now).toISOString()
    timer.value.startedAt = startedAt
    timer.value.endsAt = new Date(now + timer.value.remainingSeconds * 1000).toISOString()
    timer.value.status = 'running'
    if (timer.value.mode === 'focus' && taskId) timer.value.taskId = taskId
    else delete timer.value.taskId
    return true
  }

  const pause = (now = Date.now()) => {
    if (timer.value.status !== 'running' || !timer.value.endsAt) return false
    timer.value.remainingSeconds = Math.max(
      0,
      Math.ceil((Date.parse(timer.value.endsAt) - now) / 1000),
    )
    timer.value.status = 'paused'
    delete timer.value.endsAt
    return true
  }

  const resume = (now = Date.now()) => {
    if (timer.value.status !== 'paused' || timer.value.remainingSeconds <= 0) return false
    timer.value.endsAt = new Date(now + timer.value.remainingSeconds * 1000).toISOString()
    timer.value.status = 'running'
    return true
  }

  const reset = () => {
    const { mode, focusMinutes, breakMinutes } = timer.value
    timer.value = {
      status: 'idle',
      mode,
      focusMinutes,
      breakMinutes,
      remainingSeconds: (mode === 'focus' ? focusMinutes : breakMinutes) * 60,
    }
  }

  const complete = (now = Date.now()) => {
    if (!timer.value.startedAt) return false
    const completedAt = new Date(now).toISOString()
    sessions.value.unshift({
      id: crypto.randomUUID(),
      mode: timer.value.mode,
      startedAt: timer.value.startedAt,
      completedAt,
      durationSeconds: durationSeconds.value,
      ...(timer.value.taskId ? { taskId: timer.value.taskId } : {}),
    })
    reset()
    return true
  }

  const tick = (now = Date.now()) => {
    if (timer.value.status !== 'running' || !timer.value.endsAt) return
    timer.value.remainingSeconds = Math.max(
      0,
      Math.ceil((Date.parse(timer.value.endsAt) - now) / 1000),
    )
    if (timer.value.remainingSeconds === 0) complete(now)
  }

  const deleteSession = (id: string) => {
    sessions.value = sessions.value.filter((session) => session.id !== id)
  }

  const replaceAll = (value: FocusData) => {
    timer.value = structuredClone(value.timer)
    sessions.value = structuredClone(value.sessions)
    tick()
  }

  return {
    timer,
    sessions,
    durationSeconds,
    initialize,
    setDurations,
    setMode,
    start,
    pause,
    resume,
    reset,
    tick,
    deleteSession,
    replaceAll,
  }
})
