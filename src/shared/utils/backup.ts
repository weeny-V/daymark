import type { Pinia } from 'pinia'
import { toRaw } from 'vue'
import type { Habit } from '@/types/Habit'
import type { Note } from '@/types/Note'
import type { Settings } from '@/types/Settings'
import type { Task } from '@/types/Task'
import type { TaskOrganization } from '@/types/Organization'
import { isHabitList, useHabitsStore } from '@/stores/habits'
import { isNoteList, useNotesStore } from '@/stores/notes'
import { isSettings, useSettingsStore } from '@/stores/settings'
import { isTaskList, useTasksStore } from '@/stores/tasks'
import { EMPTY_ORGANIZATION, isTaskOrganization, useOrganizationStore } from '@/stores/organization'

export const BACKUP_VERSION = 2

export interface DaymarkBackup {
  version: typeof BACKUP_VERSION
  exportedAt: string
  data: {
    tasks: Task[]
    settings: Settings
    notes: Note[]
    habits: Habit[]
    organization: TaskOrganization
  }
}

export interface BackupSummary {
  tasks: number
  notes: number
  habits: number
  projects: number
  tags: number
}

const isExactObject = (value: unknown, keys: string[]): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))

export const parseBackup = (source: string): DaymarkBackup => {
  let value: unknown
  try {
    value = JSON.parse(source)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  if (!isExactObject(value, ['version', 'exportedAt', 'data'])) {
    throw new Error('This backup is incomplete or contains unsupported fields.')
  }
  if (value.version !== 1 && value.version !== BACKUP_VERSION) {
    throw new Error(`Backup version ${String(value.version)} is not supported.`)
  }
  if (
    typeof value.exportedAt !== 'string' ||
    Number.isNaN(Date.parse(value.exportedAt)) ||
    new Date(value.exportedAt).toISOString() !== value.exportedAt
  ) {
    throw new Error('The backup export date is invalid.')
  }
  const dataKeys =
    value.version === 1
      ? ['tasks', 'settings', 'notes', 'habits']
      : ['tasks', 'settings', 'notes', 'habits', 'organization']
  if (!isExactObject(value.data, dataKeys)) {
    throw new Error('The backup does not include every supported Daymark data type.')
  }
  if (!isTaskList(value.data.tasks)) throw new Error('The backup contains invalid tasks.')
  if (!isSettings(value.data.settings)) throw new Error('The backup contains invalid settings.')
  if (!isNoteList(value.data.notes)) throw new Error('The backup contains invalid notes.')
  if (!isHabitList(value.data.habits)) throw new Error('The backup contains invalid habits.')
  if (value.version === 2 && !isTaskOrganization(value.data.organization)) {
    throw new Error('The backup contains invalid projects or tags.')
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: value.exportedAt,
    data: {
      tasks: structuredClone(value.data.tasks),
      settings: structuredClone(value.data.settings),
      notes: structuredClone(value.data.notes),
      habits: structuredClone(value.data.habits),
      organization:
        value.version === 2
          ? structuredClone(value.data.organization as TaskOrganization)
          : structuredClone(EMPTY_ORGANIZATION),
    },
  }
}

export const createBackup = (
  pinia: Pinia,
  exportedAt = new Date().toISOString(),
): DaymarkBackup => ({
  version: BACKUP_VERSION,
  exportedAt,
  data: {
    tasks: structuredClone(toRaw(useTasksStore(pinia).tasks)),
    settings: structuredClone(toRaw(useSettingsStore(pinia).settings)),
    notes: structuredClone(toRaw(useNotesStore(pinia).notes)),
    habits: structuredClone(toRaw(useHabitsStore(pinia).habits)),
    organization: structuredClone(toRaw(useOrganizationStore(pinia).organization)),
  },
})

export const summarizeBackup = (backup: DaymarkBackup): BackupSummary => ({
  tasks: backup.data.tasks.length,
  notes: backup.data.notes.length,
  habits: backup.data.habits.length,
  projects: backup.data.organization.projects.length,
  tags: backup.data.organization.tags.length,
})

export const restoreBackup = (pinia: Pinia, backup: DaymarkBackup) => {
  useTasksStore(pinia).replaceAll(backup.data.tasks)
  useSettingsStore(pinia).replaceAll(backup.data.settings)
  useNotesStore(pinia).replaceAll(backup.data.notes)
  useHabitsStore(pinia).replaceAll(backup.data.habits)
  useOrganizationStore(pinia).replaceAll(backup.data.organization)
}
