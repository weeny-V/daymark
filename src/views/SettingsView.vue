<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { getActivePinia, storeToRefs } from 'pinia'
import AppSelectField from '@/shared/ui/AppSelectField.vue'
import AppDialog from '@/shared/ui/AppDialog.vue'
import { useSettingsStore } from '@/stores/settings'
import type { DateFormat, ThemePreference, WeekStartsOn } from '@/types/Settings'
import type { TaskPriority } from '@/types/Task'
import {
  createBackup,
  parseBackup,
  restoreBackup,
  summarizeBackup,
  type BackupSummary,
  type DaymarkBackup,
} from '@/shared/utils/backup'

const settingsStore = useSettingsStore()
const { dateFormat, defaultTaskPriority, theme, weekStartsOn } = storeToRefs(settingsStore)
const resetMessage = ref('')
const backupMessage = ref('')
const pendingBackup = ref<DaymarkBackup>()
const pendingSummary = ref<BackupSummary>()
const restoreDialogOpen = ref(false)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const pinia = getActivePinia()!

const themeOptions: { value: ThemePreference; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Use the bright Daymark palette.' },
  { value: 'dark', label: 'Dark', description: 'Use a low-light palette.' },
  {
    value: 'system',
    label: 'System',
    description: 'Follow this device’s appearance setting.',
  },
]

const resetSettings = () => {
  settingsStore.reset()
  resetMessage.value = 'Settings were reset to their defaults.'
}

const exportBackup = () => {
  const backup = createBackup(pinia)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `daymark-backup-${backup.exportedAt.slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  backupMessage.value = 'Backup downloaded.'
}

const chooseBackup = () => fileInput.value?.click()

const readBackup = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  backupMessage.value = ''
  try {
    const backup = parseBackup(await file.text())
    pendingBackup.value = backup
    pendingSummary.value = summarizeBackup(backup)
    restoreDialogOpen.value = true
  } catch (error) {
    pendingBackup.value = undefined
    pendingSummary.value = undefined
    backupMessage.value = error instanceof Error ? error.message : 'This backup could not be read.'
  }
}

const confirmRestore = () => {
  if (!pendingBackup.value) return
  restoreBackup(pinia, pendingBackup.value)
  pendingBackup.value = undefined
  pendingSummary.value = undefined
  restoreDialogOpen.value = false
  backupMessage.value = 'Backup restored. Your previous local data was replaced.'
}
</script>

<template>
  <section class="settings-view">
    <header>
      <p class="eyebrow">Your workspace</p>
      <h1>Settings</h1>
      <p class="description">
        Personalize Daymark on this device. These preferences stay in this browser.
      </p>
    </header>

    <form class="settings-form" @submit.prevent>
      <section class="settings-card" aria-labelledby="appearance-title">
        <div class="settings-card__heading">
          <p class="settings-card__number" aria-hidden="true">01</p>
          <div>
            <h2 id="appearance-title">Appearance</h2>
            <p>Choose how Daymark looks while you plan.</p>
          </div>
        </div>

        <fieldset class="theme-options">
          <legend>Color theme</legend>
          <label
            v-for="option in themeOptions"
            :key="option.value"
            class="theme-option"
            :class="{ 'theme-option--selected': theme === option.value }"
          >
            <input v-model="theme" type="radio" name="theme" :value="option.value" />
            <span>
              <strong>{{ option.label }}</strong>
              <small>{{ option.description }}</small>
            </span>
          </label>
        </fieldset>
      </section>

      <section class="settings-card" aria-labelledby="planning-title">
        <div class="settings-card__heading">
          <p class="settings-card__number" aria-hidden="true">02</p>
          <div>
            <h2 id="planning-title">Planning defaults</h2>
            <p>Set the conventions Daymark uses for dates and new tasks.</p>
          </div>
        </div>

        <div class="settings-grid">
          <AppSelectField>
            <template #label>Date format</template>
            <select v-model="dateFormat">
              <option :value="'MMMM D, YYYY' satisfies DateFormat">July 30, 2026</option>
              <option :value="'D MMMM YYYY' satisfies DateFormat">30 July 2026</option>
              <option :value="'YYYY-MM-DD' satisfies DateFormat">2026-07-30</option>
            </select>
            <template #message>Used anywhere Daymark displays a calendar date.</template>
          </AppSelectField>

          <AppSelectField>
            <template #label>First day of the week</template>
            <select v-model="weekStartsOn">
              <option :value="1 satisfies WeekStartsOn">Monday</option>
              <option :value="0 satisfies WeekStartsOn">Sunday</option>
            </select>
            <template #message>Reserved for weekly planning and calendar views.</template>
          </AppSelectField>

          <AppSelectField>
            <template #label>Default task priority</template>
            <select v-model="defaultTaskPriority">
              <option :value="'low' satisfies TaskPriority">Low</option>
              <option :value="'medium' satisfies TaskPriority">Medium</option>
              <option :value="'high' satisfies TaskPriority">High</option>
            </select>
            <template #message>Applied only to tasks created after this setting changes.</template>
          </AppSelectField>
        </div>
      </section>

      <section class="settings-card settings-card--reset" aria-labelledby="reset-title">
        <div>
          <h2 id="reset-title">Reset preferences</h2>
          <p>Restore the system theme, US date format, Monday week start, and medium priority.</p>
        </div>
        <button class="reset-button" type="button" @click="resetSettings">Reset to defaults</button>
      </section>

      <section class="settings-card settings-card--data" aria-labelledby="data-title">
        <div>
          <h2 id="data-title">Data backup</h2>
          <p>
            Download tasks, settings, notes, and habits as JSON, or restore a Daymark backup.
            Restoring replaces all current data after you review a summary.
          </p>
        </div>
        <div class="data-actions">
          <button class="data-button" type="button" @click="exportBackup">Download backup</button>
          <button class="data-button" type="button" @click="chooseBackup">Restore backup</button>
          <input
            ref="fileInput"
            class="file-input"
            type="file"
            accept="application/json,.json"
            aria-label="Choose a Daymark JSON backup"
            @change="readBackup"
          />
        </div>
      </section>
    </form>

    <p class="settings-status" role="status" aria-live="polite">
      {{ backupMessage || resetMessage }}
    </p>

    <AppDialog
      v-model:open="restoreDialogOpen"
      title="Replace your Daymark data?"
      description="Review this backup before restoring it. This action cannot be undone."
    >
      <dl v-if="pendingSummary" class="backup-summary">
        <div>
          <dt>Tasks</dt>
          <dd>{{ pendingSummary.tasks }}</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd>{{ pendingSummary.notes }}</dd>
        </div>
        <div>
          <dt>Habits</dt>
          <dd>{{ pendingSummary.habits }}</dd>
        </div>
        <div>
          <dt>Settings</dt>
          <dd>Included</dd>
        </div>
      </dl>
      <template #footer>
        <button class="data-button" type="button" @click="restoreDialogOpen = false">Cancel</button>
        <button class="restore-button" type="button" @click="confirmRestore">
          Replace all data
        </button>
      </template>
    </AppDialog>
  </section>
</template>

<style scoped>
.settings-view {
  width: min(100%, 52rem);
}

.eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.045em;
  line-height: 1.08;
}

.description {
  max-width: 40rem;
  margin: var(--space-4) 0 0;
  color: var(--color-text-muted);
  font-size: 1.0625rem;
  line-height: 1.65;
}

.settings-form {
  display: grid;
  gap: var(--space-5);
  margin-top: var(--space-8);
}

.settings-card {
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px var(--color-shadow);
}

.settings-card__heading {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.settings-card__number {
  flex: 0 0 auto;
  margin: 0.15rem 0 0;
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

h2 {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
}

.settings-card p {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  line-height: 1.55;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  padding: 0;
  margin: var(--space-5) 0 0;
  border: 0;
}

.theme-options legend {
  padding: 0;
  margin-bottom: var(--space-3);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 700;
}

.theme-option {
  position: relative;
  display: flex;
  gap: var(--space-3);
  min-height: 5.75rem;
  padding: var(--space-4);
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.theme-option:hover {
  border-color: var(--color-control-hover);
}

.theme-option--selected {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
}

.theme-option input {
  flex: 0 0 auto;
  width: 1.25rem;
  height: 1.25rem;
  margin: 0.1rem 0 0;
  accent-color: var(--color-primary);
}

.theme-option strong,
.theme-option small {
  display: block;
}

.theme-option strong {
  line-height: 1.4;
}

.theme-option small {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.45;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
  margin-top: var(--space-5);
}

.settings-card--reset {
  display: flex;
  gap: var(--space-5);
  align-items: center;
  justify-content: space-between;
}

.reset-button,
.data-button,
.restore-button {
  flex: 0 0 auto;
  min-height: 2.75rem;
  padding: var(--space-3) var(--space-4);
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.reset-button:hover,
.data-button:hover {
  background: var(--color-surface-soft);
}

.settings-card--data {
  display: grid;
  gap: var(--space-5);
}

.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.restore-button {
  color: white;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.backup-summary {
  display: grid;
  gap: var(--space-3);
  margin: 0;
}

.backup-summary div {
  display: flex;
  justify-content: space-between;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.backup-summary dd {
  margin: 0;
  font-weight: 750;
}

.settings-status {
  min-height: 1.5rem;
  margin: var(--space-3) 0 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .theme-options,
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .settings-card--reset {
    align-items: stretch;
    flex-direction: column;
  }

  .reset-button {
    width: 100%;
  }

  .data-actions,
  .data-button {
    width: 100%;
  }
}
</style>
