import dayjs, { type ConfigType } from 'dayjs'
import type { DateFormat } from '@/types/Settings'

export const formatDate = (value: ConfigType, format: DateFormat) =>
  dayjs(value).format(format)

export const formatToday = (format: DateFormat) =>
  dayjs().format(`dddd, ${format}`)
