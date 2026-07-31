import dayjs, { type ConfigType } from 'dayjs'
import type { DateFormat, WeekStartsOn } from '@/types/Settings'

export const formatDate = (value: ConfigType, format: DateFormat) =>
  dayjs(value).format(format)

export const formatToday = (format: DateFormat) =>
  dayjs().format(`dddd, ${format}`)

export const compareDateStrings = (d1: string, d2?: string): -1 | 0 | 1 => {
  const day1 = dayjs(d1)
  const day2 = d2 ? dayjs(d2) : dayjs()

  if (day1.isBefore(day2, 'day')) return -1
  if (day1.isAfter(day2, 'day')) return 1
  return 0
}

export const getWeekStartDate = (value: ConfigType, weekStartsOn: WeekStartsOn) => {
  const date = dayjs(value).startOf('day')
  const daysSinceWeekStart = (date.day() - weekStartsOn + 7) % 7

  return date.subtract(daysSinceWeekStart, 'day').format('YYYY-MM-DD')
}
