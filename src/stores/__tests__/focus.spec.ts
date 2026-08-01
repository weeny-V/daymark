import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useFocusStore } from '@/stores/focus'

const createStore = () => {
  setActivePinia(createPinia())
  const store = useFocusStore()
  store.initialize()
  return store
}

describe('focus store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts, pauses, and resumes using timestamps rather than interval counts', () => {
    const store = createStore()
    expect(store.setDurations(1, 2)).toBe(true)
    expect(store.start('task-1', 1_000)).toBe(true)
    store.tick(16_000)
    expect(store.timer.remainingSeconds).toBe(45)

    expect(store.pause(21_000)).toBe(true)
    expect(store.timer.remainingSeconds).toBe(40)
    expect(store.resume(30_000)).toBe(true)
    store.tick(45_000)
    expect(store.timer.remainingSeconds).toBe(25)
  })

  it('completes exactly once and records ISO history with an optional task ID', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('session-1')
    const store = createStore()
    store.setDurations(1, 1)
    store.start('task-1', 1_000)
    store.tick(61_000)
    store.tick(62_000)

    expect(store.sessions).toEqual([
      {
        id: 'session-1',
        mode: 'focus',
        startedAt: '1970-01-01T00:00:01.000Z',
        completedAt: '1970-01-01T00:01:01.000Z',
        durationSeconds: 60,
        taskId: 'task-1',
      },
    ])
    expect(store.timer.status).toBe('idle')
  })

  it('reconciles a running timer after reload and persists sessions', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('session-2')
    localStorage.setItem(
      'daymark.focus',
      JSON.stringify({
        timer: {
          status: 'running',
          mode: 'break',
          focusMinutes: 25,
          breakMinutes: 1,
          remainingSeconds: 60,
          startedAt: '2026-08-01T10:00:00.000Z',
          endsAt: '2026-08-01T10:01:00.000Z',
        },
        sessions: [],
      }),
    )
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-01T10:02:00.000Z'))
    const store = createStore()
    await nextTick()

    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0]?.mode).toBe('break')
    expect(JSON.parse(localStorage.getItem('daymark.focus') ?? '{}').sessions).toHaveLength(1)
  })

  it('rejects malformed persisted data safely', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    localStorage.setItem(
      'daymark.focus',
      JSON.stringify({ timer: { status: 'running' }, sessions: [] }),
    )
    const store = createStore()
    expect(store.timer).toMatchObject({ status: 'idle', focusMinutes: 25, breakMinutes: 5 })
    expect(warning).toHaveBeenCalled()
  })

  it('persists the sound preference while accepting older saved focus data', async () => {
    localStorage.setItem(
      'daymark.focus',
      JSON.stringify({
        timer: {
          status: 'idle',
          mode: 'focus',
          focusMinutes: 25,
          breakMinutes: 5,
          remainingSeconds: 1500,
        },
        sessions: [],
      }),
    )
    const store = createStore()
    expect(store.soundEnabled).toBe(true)
    store.soundEnabled = false
    await nextTick()
    expect(JSON.parse(localStorage.getItem('daymark.focus') ?? '{}').soundEnabled).toBe(false)
  })
})
