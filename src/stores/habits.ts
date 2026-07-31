import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import type { Habit, HabitInput, HabitSchedule } from '@/types/Habit'

const HABITS_STORAGE_KEY = 'daymark.habits'
const DATE_FORMAT = 'YYYY-MM-DD'

export const isDateOnly = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  dayjs(value).isValid() &&
  dayjs(value).format(DATE_FORMAT) === value

const isWeekday = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6

const isSchedule = (value: unknown): value is HabitSchedule => {
  if (typeof value !== 'object' || value === null) return false
  const schedule = value as Record<string, unknown>
  if (schedule.type === 'daily') return true
  if (schedule.type !== 'weekdays' || !Array.isArray(schedule.weekdays)) return false
  return (
    schedule.weekdays.length > 0 &&
    schedule.weekdays.every(isWeekday) &&
    new Set(schedule.weekdays).size === schedule.weekdays.length
  )
}

const isHabit = (value: unknown): value is Habit => {
  if (typeof value !== 'object' || value === null) return false
  const habit = value as Record<string, unknown>
  return (
    typeof habit.id === 'string' &&
    typeof habit.name === 'string' &&
    habit.name.trim().length > 0 &&
    typeof habit.createdAt === 'string' &&
    !Number.isNaN(Date.parse(habit.createdAt)) &&
    isSchedule(habit.schedule) &&
    Array.isArray(habit.completedDates) &&
    habit.completedDates.every(isDateOnly) &&
    new Set(habit.completedDates).size === habit.completedDates.length
  )
}

const isHabitList = (value: unknown): value is Habit[] => Array.isArray(value) && value.every(isHabit)

const normalizeSchedule = (schedule: HabitSchedule): HabitSchedule =>
  schedule.type === 'daily'
    ? { type: 'daily' }
    : { type: 'weekdays', weekdays: [...new Set(schedule.weekdays)].sort((a, b) => a - b) }

export const isHabitScheduledForDate = (habit: Habit, date: string) => {
  if (!isDateOnly(date) || dayjs(date).isBefore(dayjs(habit.createdAt), 'day')) return false
  return habit.schedule.type === 'daily' || habit.schedule.weekdays.includes(dayjs(date).day())
}

export const useHabitsStore = defineStore('habits', () => {
  const storage = useLocalStorage<Habit[]>({
    key: HABITS_STORAGE_KEY,
    fallback: () => [],
    validate: isHabitList,
  })
  const habits = ref<Habit[]>([])
  const selectedDate = ref(dayjs().format(DATE_FORMAT))
  let initialized = false

  const initialize = () => {
    if (initialized) return
    habits.value = storage.get()
    watch(habits, (value) => storage.set(value), { deep: true })
    initialized = true
  }

  const addHabit = (input: HabitInput) => {
    const name = input.name.trim()
    if (!name || !isSchedule(input.schedule)) return false
    habits.value.push({
      id: crypto.randomUUID(),
      name,
      schedule: normalizeSchedule(input.schedule),
      completedDates: [],
      createdAt: new Date().toISOString(),
    })
    return true
  }

  const updateHabit = (id: string, input: HabitInput) => {
    const habit = habits.value.find((item) => item.id === id)
    const name = input.name.trim()
    if (!habit || !name || !isSchedule(input.schedule)) return false
    habit.name = name
    habit.schedule = normalizeSchedule(input.schedule)
    return true
  }

  const deleteHabit = (id: string) => {
    habits.value = habits.value.filter((habit) => habit.id !== id)
  }

  const toggleHabitForDate = (id: string, date: string) => {
    const habit = habits.value.find((item) => item.id === id)
    if (!habit || !isHabitScheduledForDate(habit, date)) return false
    const index = habit.completedDates.indexOf(date)
    if (index >= 0) habit.completedDates.splice(index, 1)
    else habit.completedDates.push(date)
    return true
  }

  const habitsForSelectedDate = computed(() =>
    habits.value.filter((habit) => isHabitScheduledForDate(habit, selectedDate.value)),
  )

  const isCompleted = (habit: Habit, date: string) => habit.completedDates.includes(date)

  const currentStreak = (habit: Habit, throughDate = selectedDate.value) => {
    if (!isDateOnly(throughDate)) return 0
    let cursor = dayjs(throughDate).startOf('day')
    const today = dayjs().startOf('day')
    if (cursor.isAfter(today)) cursor = today

    while (!isHabitScheduledForDate(habit, cursor.format(DATE_FORMAT))) {
      if (cursor.isBefore(dayjs(habit.createdAt), 'day')) return 0
      cursor = cursor.subtract(1, 'day')
    }

    if (cursor.isSame(today, 'day') && !isCompleted(habit, cursor.format(DATE_FORMAT))) {
      cursor = cursor.subtract(1, 'day')
      while (!isHabitScheduledForDate(habit, cursor.format(DATE_FORMAT))) {
        if (cursor.isBefore(dayjs(habit.createdAt), 'day')) return 0
        cursor = cursor.subtract(1, 'day')
      }
    }

    let streak = 0
    while (!cursor.isBefore(dayjs(habit.createdAt), 'day')) {
      const date = cursor.format(DATE_FORMAT)
      if (isHabitScheduledForDate(habit, date)) {
        if (!isCompleted(habit, date)) break
        streak += 1
      }
      cursor = cursor.subtract(1, 'day')
    }
    return streak
  }

  const recentHistory = (habit: Habit, throughDate = selectedDate.value, limit = 7) => {
    const history: { date: string; completed: boolean }[] = []
    let cursor = dayjs(throughDate).startOf('day')
    while (history.length < limit && !cursor.isBefore(dayjs(habit.createdAt), 'day')) {
      const date = cursor.format(DATE_FORMAT)
      if (isHabitScheduledForDate(habit, date)) {
        history.push({ date, completed: isCompleted(habit, date) })
      }
      cursor = cursor.subtract(1, 'day')
    }
    return history.reverse()
  }

  return {
    habits,
    selectedDate,
    habitsForSelectedDate,
    initialize,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitForDate,
    isCompleted,
    currentStreak,
    recentHistory,
  }
})

