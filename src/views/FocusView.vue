<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import AppButton from '@/shared/ui/AppButton.vue'
import AppField from '@/shared/ui/AppField.vue'
import AppSelectField from '@/shared/ui/AppSelectField.vue'
import { useFocusStore } from '@/stores/focus'
import { useTasksStore } from '@/stores/tasks'

const focusStore = useFocusStore()
const tasksStore = useTasksStore()
const { timer, sessions, soundEnabled } = storeToRefs(focusStore)
const selectedTaskId = ref('')
const focusMinutes = ref(timer.value.focusMinutes)
const breakMinutes = ref(timer.value.breakMinutes)
const durationError = ref('')
let intervalId: number | undefined
let audioContext: AudioContext | undefined

const activeTasks = computed(() => tasksStore.tasks.filter((task) => !task.completed))
const timeLabel = computed(() => {
  const minutes = Math.floor(timer.value.remainingSeconds / 60)
  const seconds = timer.value.remainingSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})
const stateLabel = computed(() => {
  if (timer.value.status === 'idle') return 'Ready'
  if (timer.value.status === 'paused') return 'Paused'
  return 'Running'
})
const sessionTask = (taskId?: string) => {
  if (!taskId) return ''
  return tasksStore.tasks.find((task) => task.id === taskId)?.title ?? 'Deleted task'
}

const saveDurations = () => {
  if (!focusStore.setDurations(focusMinutes.value, breakMinutes.value)) {
    durationError.value = 'Choose whole minutes between 1 and 180.'
  } else durationError.value = ''
}

const selectMode = (mode: 'focus' | 'break') => {
  if (focusStore.setMode(mode)) selectedTaskId.value = ''
}

const handleVisibility = () => focusStore.tick()

const prepareCompletionChime = () => {
  if (!soundEnabled.value || audioContext || !window.AudioContext) return
  audioContext = new window.AudioContext()
}

const startTimer = () => {
  prepareCompletionChime()
  focusStore.start(selectedTaskId.value || undefined)
}

const playCompletionChime = () => {
  const AudioContextClass = window.AudioContext
  if (!AudioContextClass) return

  const context = audioContext ?? new AudioContextClass()
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 1.2)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 2.2)
  gain.connect(context.destination)

  ;[523.25, 659.25].forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    oscillator.connect(gain)
    oscillator.start(context.currentTime + index * 0.25)
    oscillator.stop(context.currentTime + 1.9 + index * 0.25)
  })
  window.setTimeout(() => {
    void context.close()
    if (audioContext === context) audioContext = undefined
  }, 2400)
}

watch(
  () => sessions.value.length,
  (length, previousLength) => {
    if (soundEnabled.value && length > previousLength) playCompletionChime()
  },
)

onMounted(() => {
  focusStore.tick()
  intervalId = window.setInterval(() => focusStore.tick(), 1000)
  document.addEventListener('visibilitychange', handleVisibility)
})

onBeforeUnmount(() => {
  if (intervalId !== undefined) window.clearInterval(intervalId)
  document.removeEventListener('visibilitychange', handleVisibility)
})
</script>

<template>
  <section class="focus-view">
    <header>
      <p class="eyebrow">Work with intention</p>
      <h1>Focus</h1>
      <p class="description">Use a quiet timer for focused work and restorative breaks.</p>
    </header>

    <div class="focus-layout">
      <section class="timer-card" aria-labelledby="timer-title">
        <div class="mode-picker" aria-label="Session type">
          <button
            type="button"
            :aria-pressed="timer.mode === 'focus'"
            :disabled="timer.status !== 'idle'"
            @click="selectMode('focus')"
          >
            Focus
          </button>
          <button
            type="button"
            :aria-pressed="timer.mode === 'break'"
            :disabled="timer.status !== 'idle'"
            @click="selectMode('break')"
          >
            Break
          </button>
        </div>

        <p id="timer-title" class="timer-kind">{{ timer.mode }} session</p>
        <p class="timer" role="timer" :aria-label="`${timeLabel} remaining, ${stateLabel}`">
          {{ timeLabel }}
        </p>
        <p class="timer-state" aria-live="polite">{{ stateLabel }}</p>

        <AppSelectField v-if="timer.mode === 'focus' && timer.status === 'idle'">
          <template #label>Task (optional)</template>
          <select v-model="selectedTaskId">
            <option value="">No linked task</option>
            <option v-for="task in activeTasks" :key="task.id" :value="task.id">
              {{ task.title }}
            </option>
          </select>
        </AppSelectField>

        <div class="timer-actions">
          <AppButton v-if="timer.status === 'idle'" @click="startTimer">
            Start {{ timer.mode }}
          </AppButton>
          <AppButton v-else-if="timer.status === 'running'" @click="focusStore.pause()">
            Pause
          </AppButton>
          <AppButton v-else @click="focusStore.resume()">Resume</AppButton>
          <button v-if="timer.status !== 'idle'" type="button" @click="focusStore.reset()">
            Reset
          </button>
        </div>
      </section>

      <section class="settings-card" aria-labelledby="duration-title">
        <h2 id="duration-title">Session lengths</h2>
        <p>Set a pace that feels sustainable. Changes apply to the next session.</p>
        <form @submit.prevent="saveDurations">
          <AppField>
            <template #label>Focus minutes</template>
            <input v-model.number="focusMinutes" type="number" min="1" max="180" step="1" />
          </AppField>
          <AppField>
            <template #label>Break minutes</template>
            <input v-model.number="breakMinutes" type="number" min="1" max="180" step="1" />
          </AppField>
          <p v-if="durationError" class="error" role="alert">{{ durationError }}</p>
          <label class="sound-control">
            <input v-model="soundEnabled" type="checkbox" />
            Play a sound when a session ends
          </label>
          <AppButton type="submit" :disabled="timer.status !== 'idle'">Save lengths</AppButton>
        </form>
      </section>
    </div>

    <section class="history" aria-labelledby="history-title">
      <div>
        <p class="eyebrow">Local history</p>
        <h2 id="history-title">Completed sessions</h2>
      </div>
      <p v-if="!sessions.length" class="empty">Completed sessions will appear here.</p>
      <ul v-else>
        <li v-for="session in sessions" :key="session.id">
          <div>
            <strong>{{ session.mode === 'focus' ? 'Focus' : 'Break' }}</strong>
            <span>
              {{ Math.round(session.durationSeconds / 60) }} min ·
              {{ dayjs(session.completedAt).format('MMM D, YYYY, h:mm A') }}
            </span>
            <span v-if="session.taskId">Task: {{ sessionTask(session.taskId) }}</span>
          </div>
          <button
            type="button"
            :aria-label="`Delete ${session.mode} session from ${dayjs(session.completedAt).format('MMMM D')}`"
            @click="focusStore.deleteSession(session.id)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
            </svg>
          </button>
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.focus-view {
  max-width: 64rem;
}
h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.045em;
}
h2 {
  margin: 0;
}
.eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.description,
.settings-card > p,
.empty {
  color: var(--color-text-muted);
  line-height: 1.6;
}
.focus-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(17rem, 0.6fr);
  gap: var(--space-4);
  margin-top: var(--space-8);
}
.timer-card,
.settings-card,
.history {
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px var(--color-shadow);
}
.timer-card {
  display: grid;
  gap: var(--space-4);
  justify-items: center;
  text-align: center;
}
.mode-picker {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: min(22rem, 100%);
  padding: var(--space-1);
  background: var(--color-surface-soft);
  border-radius: var(--radius-sm);
}
.mode-picker button {
  min-height: 2.75rem;
  color: var(--color-text-muted);
  background: transparent;
  border: 0;
  border-radius: calc(var(--radius-sm) - 3px);
  font-weight: 700;
  cursor: pointer;
}
.mode-picker button[aria-pressed='true'] {
  color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 2px 8px var(--color-shadow);
}
.timer-kind {
  margin: var(--space-3) 0 0;
  color: var(--color-text-muted);
  text-transform: capitalize;
}
.timer {
  margin: 0;
  font-size: clamp(4rem, 13vw, 7rem);
  font-variant-numeric: tabular-nums;
  font-weight: 750;
  letter-spacing: -0.06em;
  line-height: 1;
}
.timer-state {
  margin: 0;
  color: var(--color-primary);
  font-weight: 700;
}
.timer-card :deep(.select-field) {
  width: min(26rem, 100%);
  text-align: left;
}
.timer-actions {
  display: flex;
  gap: var(--space-3);
  width: min(26rem, 100%);
}
.timer-actions > * {
  flex: 1;
}
.timer-actions > button:not(.app-button),
.history li > button {
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-3);
  color: var(--color-text);
  background: transparent;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}
.settings-card form {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-5);
}
.sound-control {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  min-height: 2.75rem;
}
.sound-control input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-primary);
}
.error {
  margin: 0;
  color: #b42318;
  font-size: 0.875rem;
}
.history {
  margin-top: var(--space-4);
}
.history ul {
  display: grid;
  gap: var(--space-2);
  padding: 0;
  margin: var(--space-5) 0 0;
  list-style: none;
}
.history li {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  min-height: 4rem;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-soft);
  border-radius: var(--radius-sm);
}
.history li div {
  display: grid;
  gap: var(--space-1);
}
.history li span {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
.history li > button {
  display: grid;
  width: 2.75rem;
  padding: 0;
  color: #b42318;
  place-items: center;
}
.history li > button:hover {
  background: #fff0ef;
  border-color: color-mix(in srgb, #b42318 35%, var(--color-control-border));
}
.history li > button svg {
  width: 1.125rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}
@media (max-width: 760px) {
  .focus-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 420px) {
  .timer-actions,
  .history li {
    flex-direction: column;
    align-items: stretch;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto;
    transition: none !important;
  }
}
</style>
