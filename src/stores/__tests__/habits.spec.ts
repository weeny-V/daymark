import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useHabitsStore } from '@/stores/habits'
import type { Habit } from '@/types/Habit'

const STORAGE_KEY = 'daymark.habits'
const savedHabit: Habit = {
  id: 'habit-1',
  name: 'Stretch',
  schedule: { type: 'weekdays', weekdays: [1, 3, 5] },
  completedDates: ['2026-07-27', '2026-07-29'],
  createdAt: '2026-07-20T08:00:00.000Z',
}

const createStore = () => {
  setActivePinia(createPinia())
  return useHabitsStore()
}

describe('habit store', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('creates, edits, and deletes a validated habit', () => {
    const store = createStore()
    store.initialize()

    expect(store.addHabit({ name: '  Read  ', schedule: { type: 'daily' } })).toBe(true)
    expect(store.addHabit({ name: '', schedule: { type: 'daily' } })).toBe(false)
    expect(store.addHabit({ name: 'Invalid', schedule: { type: 'weekdays', weekdays: [] } })).toBe(false)
    expect(store.habits[0]).toMatchObject({ name: 'Read', schedule: { type: 'daily' }, completedDates: [] })

    const id = store.habits[0]!.id
    expect(store.updateHabit(id, { name: 'Read a chapter', schedule: { type: 'weekdays', weekdays: [5, 1] } })).toBe(true)
    expect(store.habits[0]!.schedule).toEqual({ type: 'weekdays', weekdays: [1, 5] })

    store.deleteHabit(id)
    expect(store.habits).toEqual([])
  })

  it('shows only habits scheduled for the selected local day', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([savedHabit, { ...savedHabit, id: 'daily', schedule: { type: 'daily' } }]))
    const store = createStore()
    store.initialize()

    store.selectedDate = '2026-07-29'
    expect(store.habitsForSelectedDate.map((habit) => habit.id)).toEqual(['habit-1', 'daily'])

    store.selectedDate = '2026-07-30'
    expect(store.habitsForSelectedDate.map((habit) => habit.id)).toEqual(['daily'])
  })

  it('records completion by date, toggles it once, and persists it', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([savedHabit]))
    const store = createStore()
    store.initialize()

    expect(store.toggleHabitForDate(savedHabit.id, '2026-07-31')).toBe(true)
    expect(store.habits[0]!.completedDates).toContain('2026-07-31')
    expect(store.toggleHabitForDate(savedHabit.id, '2026-07-30')).toBe(false)
    expect(store.toggleHabitForDate(savedHabit.id, '2026-07-31')).toBe(true)
    await nextTick()

    expect(store.habits[0]!.completedDates).not.toContain('2026-07-31')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual([savedHabit])
  })

  it('calculates streaks across scheduled occurrences rather than calendar days', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...savedHabit, completedDates: ['2026-07-27', '2026-07-29', '2026-07-31'] }]))
    const store = createStore()
    store.initialize()

    expect(store.currentStreak(store.habits[0]!, '2026-07-31')).toBe(3)
    expect(store.recentHistory(store.habits[0]!, '2026-07-31')).toEqual([
      { date: '2026-07-20', completed: false },
      { date: '2026-07-22', completed: false },
      { date: '2026-07-24', completed: false },
      { date: '2026-07-27', completed: true },
      { date: '2026-07-29', completed: true },
      { date: '2026-07-31', completed: true },
    ])
  })

  it('keeps an actionable streak through local midnight until today is completed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 31, 0, 1))
    localStorage.setItem(STORAGE_KEY, JSON.stringify([savedHabit]))
    const store = createStore()
    store.initialize()

    expect(store.currentStreak(store.habits[0]!, '2026-07-31')).toBe(2)
    store.toggleHabitForDate(savedHabit.id, '2026-07-31')
    expect(store.currentStreak(store.habits[0]!, '2026-07-31')).toBe(3)
  })

  it('recovers safely from invalid persisted habit data', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...savedHabit, schedule: { type: 'weekdays', weekdays: [8] } }]))
    const store = createStore()

    expect(() => store.initialize()).not.toThrow()
    expect(store.habits).toEqual([])
    expect(warning).toHaveBeenCalled()
  })
})

