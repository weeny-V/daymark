<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import { motion, useReducedMotion } from 'motion-v'
import AppButton from '@/shared/ui/AppButton.vue'
import { useTasksStore } from '@/stores/tasks'
import { isHabitScheduledForDate, useHabitsStore } from '@/stores/habits'
import { useNotesStore } from '@/stores/notes'
import { useSettingsStore } from '@/stores/settings'
import { compareDateStrings, formatToday } from '@/shared/utils/date'

const tasksStore = useTasksStore()
const habitsStore = useHabitsStore()
const notesStore = useNotesStore()
const { tasks } = storeToRefs(tasksStore)
const { habits } = storeToRefs(habitsStore)
const { pinnedNote } = storeToRefs(notesStore)
const { dateFormat } = storeToRefs(useSettingsStore())
const quickTaskTitle = ref('')
const quickTaskError = ref('')
const shouldReduceMotion = useReducedMotion()
const today = computed(() => dayjs().format('YYYY-MM-DD'))

const overdueTasks = computed(() =>
  tasks.value.filter(
    (task) => !task.completed && task.dueTo && compareDateStrings(task.dueTo, today.value) < 0,
  ),
)
const dueTodayTasks = computed(() =>
  tasks.value.filter((task) => task.dueTo && compareDateStrings(task.dueTo, today.value) === 0),
)
const completedTodayTasks = computed(
  () => dueTodayTasks.value.filter((task) => task.completed).length,
)
const todayHabits = computed(() =>
  habits.value.filter((habit) => isHabitScheduledForDate(habit, today.value)),
)
const completedTodayHabits = computed(
  () => todayHabits.value.filter((habit) => habitsStore.isCompleted(habit, today.value)).length,
)
const combinedCompleted = computed(() => completedTodayTasks.value + completedTodayHabits.value)
const combinedTotal = computed(() => dueTodayTasks.value.length + todayHabits.value.length)
const completionPercent = computed(() =>
  combinedTotal.value ? Math.round((combinedCompleted.value / combinedTotal.value) * 100) : 0,
)
const fillTransition = computed(() =>
  shouldReduceMotion.value
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 110, damping: 20, mass: 0.8 },
)

const addQuickTask = () => {
  const title = quickTaskTitle.value.trim()
  if (!title) {
    quickTaskError.value = 'Enter a task title'
    return
  }
  if (tasksStore.addTask({ title, dueTo: today.value })) {
    quickTaskTitle.value = ''
    quickTaskError.value = ''
  }
}

const notePreview = computed(() =>
  pinnedNote.value?.body.trim() || 'This pinned note is ready when you want to add more detail.',
)
</script>

<template>
  <section class="today-view">
    <header>
      <p class="eyebrow">{{ formatToday(dateFormat) }}</p>
      <h1>Today</h1>
      <p class="description">A calm overview of what matters and where to focus next.</p>
    </header>

    <section class="daily-progress" aria-labelledby="daily-progress-title">
      <div>
        <p class="eyebrow">Daily progress</p>
        <h2 id="daily-progress-title">{{ combinedCompleted }} of {{ combinedTotal }} check-ins complete</h2>
      </div>
      <div class="progress-visual">
        <progress
          class="sr-only"
          :value="combinedCompleted"
          :max="Math.max(combinedTotal, 1)"
          aria-label="Daily completion progress"
        >
          {{ combinedCompleted }} of {{ combinedTotal }}
        </progress>
        <div class="segmented-progress" aria-hidden="true">
          <div class="segmented-progress__track">
            <span class="progress-segment">
              <motion.span
                class="progress-segment__fill"
                :initial="false"
                :animate="{ width: `${completionPercent}%` }"
                :transition="fillTransition"
              />
            </span>
          </div>
          <span class="segmented-progress__percent">{{ completionPercent }}%</span>
        </div>
      </div>
    </section>

    <form class="quick-capture" aria-label="Quick task capture" @submit.prevent="addQuickTask">
      <div>
        <label for="quick-task-title">Quick task</label>
        <input
          id="quick-task-title"
          v-model="quickTaskTitle"
          placeholder="What needs your attention today?"
          :aria-invalid="quickTaskError ? 'true' : undefined"
          :aria-describedby="quickTaskError ? 'quick-task-error' : undefined"
          @input="quickTaskError = ''"
        />
        <p v-if="quickTaskError" id="quick-task-error" role="alert">{{ quickTaskError }}</p>
      </div>
      <AppButton type="submit">Add for today</AppButton>
    </form>

    <div class="dashboard-grid">
      <section class="dashboard-card tasks-card" aria-labelledby="today-tasks-title">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Plan</p>
            <h2 id="today-tasks-title">Tasks</h2>
          </div>
          <RouterLink to="/tasks">View all</RouterLink>
        </div>

        <div v-if="overdueTasks.length" class="task-group">
          <h3>Overdue</h3>
          <ul>
            <li v-for="task in overdueTasks" :key="task.id">
              <label>
                <input
                  type="checkbox"
                  :checked="task.completed"
                  @change="tasksStore.toggleTask(task.id)"
                />
                <span>{{ task.title }} <small>Overdue</small></span>
              </label>
            </li>
          </ul>
        </div>

        <div v-if="dueTodayTasks.length" class="task-group">
          <h3>Due today</h3>
          <ul>
            <li v-for="task in dueTodayTasks" :key="task.id">
              <label>
                <input
                  type="checkbox"
                  :checked="task.completed"
                  @change="tasksStore.toggleTask(task.id)"
                />
                <span :class="{ completed: task.completed }">{{ task.title }}</span>
              </label>
            </li>
          </ul>
        </div>

        <p v-if="!overdueTasks.length && !dueTodayTasks.length" class="card-empty">
          Nothing is due today. Use quick capture whenever something comes up.
        </p>
      </section>

      <section class="dashboard-card habits-card" aria-labelledby="today-habits-title">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Routine</p>
            <h2 id="today-habits-title">Habits</h2>
          </div>
          <RouterLink to="/habits">Manage</RouterLink>
        </div>
        <p class="card-progress" aria-live="polite">
          {{ completedTodayHabits }} of {{ todayHabits.length }} completed
        </p>
        <ul v-if="todayHabits.length" class="check-list">
          <li v-for="habit in todayHabits" :key="habit.id">
            <label>
              <input
                type="checkbox"
                :checked="habitsStore.isCompleted(habit, today)"
                @change="habitsStore.toggleHabitForDate(habit.id, today)"
              />
              <span>
                <strong>{{ habit.name }}</strong>
                <small>{{ habitsStore.isCompleted(habit, today) ? 'Completed' : 'Ready' }}</small>
              </span>
            </label>
          </li>
        </ul>
        <p v-else class="card-empty">
          No habits are scheduled today.
          <RouterLink to="/habits">Add a habit</RouterLink>
          when you want to shape a routine.
        </p>
      </section>

      <section class="dashboard-card note-card" aria-labelledby="pinned-note-title">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Keep in view</p>
            <h2 id="pinned-note-title">Pinned note</h2>
          </div>
          <RouterLink to="/notes">Open notes</RouterLink>
        </div>
        <article v-if="pinnedNote" class="pinned-note">
          <p class="pin-label"><span aria-hidden="true">★</span> Pinned</p>
          <h3>{{ pinnedNote.title.trim() || 'Untitled note' }}</h3>
          <p>{{ notePreview }}</p>
        </article>
        <p v-else class="card-empty">
          Pin a useful note to keep its context close to today’s plan.
        </p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.today-view { max-width: 68rem; }
.eyebrow { margin: 0 0 var(--space-2); color: var(--color-primary); font-size: .75rem; font-weight: 750; letter-spacing: .09em; text-transform: uppercase; }
h1 { margin: 0; font-size: clamp(2rem, 5vw, 3rem); letter-spacing: -.045em; line-height: 1.08; }
h2, h3 { margin: 0; }
.description { max-width: 40rem; margin: var(--space-4) 0 0; color: var(--color-text-muted); font-size: 1.0625rem; line-height: 1.65; }
.daily-progress, .quick-capture, .dashboard-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: 0 8px 24px var(--color-shadow); }
.daily-progress { display: grid; grid-template-columns: minmax(0, 1fr) minmax(10rem, .7fr); gap: var(--space-5); align-items: center; padding: var(--space-5); margin-top: var(--space-8); }
.daily-progress h2 { font-size: 1.25rem; }
.progress-visual { min-width: 0; }
.segmented-progress { display: flex; gap: var(--space-3); align-items: center; width: 100%; }
.segmented-progress__track { flex: 1 1 auto; min-width: 0; }
.progress-segment { display: block; width: 100%; height: .8rem; overflow: hidden; background: color-mix(in srgb, #9ab5ca 28%, var(--color-surface-soft)); border-radius: 999px; box-shadow: inset 0 1px 2px rgb(24 26 32 / 6%); }
.progress-segment__fill { display: block; height: 100%; background: linear-gradient(90deg, #aaa5ff, #45bdf2); border-radius: inherit; box-shadow: 0 1px 3px rgb(56 121 210 / 24%); }
.segmented-progress__percent { flex: 0 0 2.5rem; color: var(--color-text); font-size: .75rem; font-weight: 800; text-align: right; }
.quick-capture { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--space-3); align-items: end; padding: var(--space-4); margin-top: var(--space-4); }
.quick-capture > div { display: grid; gap: var(--space-2); }
.quick-capture label { font-size: .8125rem; font-weight: 700; }
.quick-capture input { width: 100%; min-width: 0; min-height: 3rem; padding: var(--space-3) var(--space-4); color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-control-border); border-radius: var(--radius-sm); font: inherit; }
.quick-capture p { margin: 0; color: #b42318; font-size: .8125rem; font-weight: 650; }
.dashboard-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); margin-top: var(--space-4); }
.dashboard-card { min-width: 0; padding: var(--space-5); }
.tasks-card { grid-row: span 2; }
.card-heading { display: flex; gap: var(--space-3); align-items: center; justify-content: space-between; }
.card-heading h2 { font-size: 1.375rem; }
.card-heading a, .card-empty a { display: inline-flex; align-items: center; min-height: 2.75rem; color: var(--color-primary); font-weight: 700; }
.task-group { margin-top: var(--space-5); }
.task-group h3 { color: var(--color-text-muted); font-size: .8125rem; text-transform: uppercase; }
.task-group ul, .check-list { display: grid; gap: var(--space-2); padding: 0; margin: var(--space-3) 0 0; list-style: none; }
.task-group label, .check-list label { display: flex; gap: var(--space-3); align-items: center; min-height: 3.25rem; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; }
.task-group input, .check-list input { flex: 0 0 auto; width: 1.25rem; height: 1.25rem; accent-color: var(--color-primary); }
.task-group small { display: inline-block; margin-left: var(--space-2); color: #b42318; font-size: .6875rem; font-weight: 750; }
.completed { color: var(--color-text-muted); text-decoration: line-through; }
.card-progress, .card-empty { margin: var(--space-4) 0 0; color: var(--color-text-muted); line-height: 1.6; }
.check-list label > span { display: grid; gap: var(--space-1); }
.check-list small { color: var(--color-text-muted); }
.pinned-note { margin-top: var(--space-4); }
.pinned-note .pin-label { margin: 0 0 var(--space-2); color: var(--color-primary); font-size: .75rem; font-weight: 750; text-transform: uppercase; }
.pinned-note h3 { font-size: 1.125rem; }
.pinned-note > p:last-child { display: -webkit-box; margin: var(--space-2) 0 0; color: var(--color-text-muted); line-height: 1.6; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 4; }
@media (max-width: 800px) { .dashboard-grid { grid-template-columns: 1fr; } .tasks-card { grid-row: auto; } }
@media (max-width: 560px) { .daily-progress, .quick-capture { grid-template-columns: 1fr; } .quick-capture :deep(.app-button) { width: 100%; } .card-heading { align-items: flex-start; } }
@media (max-width: 420px) { .segmented-progress { gap: var(--space-2); } }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
</style>
