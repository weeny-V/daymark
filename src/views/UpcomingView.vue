<script setup lang="ts">
import { useTasksStore } from "@/stores/tasks.ts";
import AppTaskItem from "@/components/tasks/AppTaskItem.vue";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, ref } from 'vue'
import AppTaskEditDialog from '@/components/tasks/AppTaskEditDialog.vue'
import { useSettingsStore } from '@/stores/settings'
import { formatDate, getWeekStartDate } from '@/shared/utils/date'
import type { Task } from '@/types/Task'

const tasksStore = useTasksStore()
const { upcoming } = storeToRefs(tasksStore)
const { deleteTask, toggleTask } = tasksStore
const { dateFormat, weekStartsOn } = storeToRefs(useSettingsStore())
const editingTaskId = ref<string | null>(null)
const completionFeedback = ref<Record<string, string>>({})
const completionTimers = new Map<string, number>()
const editingTask = computed(
  () => tasksStore.tasks.find((task) => task.id === editingTaskId.value) ?? null,
)
const editDialogOpen = computed({
  get: () => editingTask.value !== null,
  set: (open) => {
    if (!open) editingTaskId.value = null
  },
})

const openEditor = (taskId: string) => {
  editingTaskId.value = taskId
}

const handleToggle = (task: Task) => {
  if (task.completed || !task.recurrence || !task.dueTo) {
    toggleTask(task.id)
    return
  }
  const nextDueTo = tasksStore.nextDueDate(task.dueTo, task.recurrence)
  completionFeedback.value = {
    ...completionFeedback.value,
    [task.id]: `Completed. Next occurrence: ${formatDate(nextDueTo, dateFormat.value)}.`,
  }
  window.clearTimeout(completionTimers.get(task.id))
  completionTimers.set(
    task.id,
    window.setTimeout(() => {
      toggleTask(task.id)
      const next = { ...completionFeedback.value }
      delete next[task.id]
      completionFeedback.value = next
      completionTimers.delete(task.id)
    }, 1400),
  )
}

onBeforeUnmount(() => completionTimers.forEach((timer) => window.clearTimeout(timer)))

const laterWeekGroups = computed(() => {
  const currentWeekStart = getWeekStartDate(undefined, weekStartsOn.value)
  const groups = new Map<string, typeof upcoming.value.later>()

  upcoming.value.later.forEach((task) => {
    const weekStart = getWeekStartDate(task.dueTo, weekStartsOn.value)
    const group = groups.get(weekStart) ?? []
    group.push(task)
    groups.set(weekStart, group)
  })

  return Array.from(groups, ([weekStart, tasks]) => ({
    weekStart,
    label:
      weekStart === currentWeekStart
        ? 'This week'
        : `Week of ${formatDate(weekStart, dateFormat.value)}`,
    tasks,
  }))
})

</script>

<template>
  <section class="upcoming-view">
    <header class="upcoming-view__header">
      <div>
        <p class="eyebrow">Your schedule</p>
        <h1>Upcoming</h1>
        <p class="description">
          See overdue work, what is due today, and what is waiting further ahead.
        </p>
      </div>

      <RouterLink class="tasks-link" to="/tasks">
        Manage tasks
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="m7 4 6 6-6 6" />
        </svg>
      </RouterLink>
    </header>

    <dl class="schedule-summary" aria-label="Scheduled task summary">
      <div>
        <dt>Overdue</dt>
        <dd>{{upcoming.overdue.length}}</dd>
      </div>
      <div>
        <dt>Due today</dt>
        <dd>{{upcoming.today.length}}</dd>
      </div>
      <div>
        <dt>Upcoming</dt>
        <dd>{{upcoming.later.length}}</dd>
      </div>
    </dl>

    <div class="schedule-groups">
      <section class="schedule-group schedule-group--overdue" aria-labelledby="overdue-title">
        <div class="schedule-group__heading">
          <span class="schedule-group__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 7v6l4 2" />
            </svg>
          </span>
          <div>
            <p class="schedule-group__label">Needs attention</p>
            <h2 id="overdue-title">Overdue</h2>
          </div>
          <span class="schedule-group__count">{{upcoming.overdue.length}} tasks</span>
        </div>

        <p v-if="upcoming.overdue.length === 0" class="schedule-group__empty">
          Nothing is overdue. Tasks that pass their due date will appear here.
        </p>

        <ul class="upcoming-list">
          <AppTaskItem
            v-for="task in upcoming.overdue"
            :key="task.id"
            :task="task"
            :completion-pending="Boolean(completionFeedback[task.id])"
            :completion-message="completionFeedback[task.id]"
            @delete="deleteTask"
            @edit="openEditor"
            @toggle="handleToggle(task)"
          />
        </ul>
      </section>

      <section class="schedule-group schedule-group--today" aria-labelledby="today-title">
        <div class="schedule-group__heading">
          <span class="schedule-group__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 5h14v15H5zM8 3v4M16 3v4M5 9h14" />
              <path d="m9 15 2 2 4-5" />
            </svg>
          </span>
          <div>
            <p class="schedule-group__label">Focus now</p>
            <h2 id="today-title">Today</h2>
          </div>
          <span class="schedule-group__count">{{upcoming.today.length}} tasks</span>
        </div>

        <p v-if="upcoming.today.length === 0" class="schedule-group__empty">
          Your day is clear. Tasks due today will be collected in this section.
        </p>

        <ul class="upcoming-list">
          <AppTaskItem
            v-for="task in upcoming.today"
            :key="task.id"
            :task="task"
            :completion-pending="Boolean(completionFeedback[task.id])"
            :completion-message="completionFeedback[task.id]"
            @delete="deleteTask"
            @edit="openEditor"
            @toggle="handleToggle(task)"
          />
        </ul>
      </section>

      <section class="schedule-group" aria-labelledby="later-title">
        <div class="schedule-group__heading">
          <span class="schedule-group__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 5h14v15H5zM8 3v4M16 3v4M5 9h14" />
              <path d="M9 13h6M9 17h4" />
            </svg>
          </span>
          <div>
            <p class="schedule-group__label">Plan ahead</p>
            <h2 id="later-title">Later</h2>
          </div>
          <span class="schedule-group__count">{{upcoming.later.length}} tasks</span>
        </div>

        <p v-if="upcoming.later.length === 0" class="schedule-group__empty">
          Future tasks will appear here in due-date order when you begin scheduling work.
        </p>

        <ul v-if="laterWeekGroups.length" class="later-weeks">
          <li v-for="group in laterWeekGroups" :key="group.weekStart" class="later-week">
            <h3 class="later-week__title">{{ group.label }}</h3>
            <ul class="upcoming-list">
              <AppTaskItem
                v-for="task in group.tasks"
                :key="task.id"
                :task="task"
                :completion-pending="Boolean(completionFeedback[task.id])"
                :completion-message="completionFeedback[task.id]"
                @delete="deleteTask"
                @edit="openEditor"
                @toggle="handleToggle(task)"
              />
            </ul>
          </li>
        </ul>
      </section>
    </div>

    <AppTaskEditDialog v-model:open="editDialogOpen" :task="editingTask" />
  </section>
</template>

<style scoped>
.upcoming-view {
  width: min(100%, 56rem);
}

.upcoming-view__header {
  display: flex;
  gap: var(--space-5);
  align-items: flex-end;
  justify-content: space-between;
}

.upcoming-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.later-weeks {
  padding: 0;
  margin: 0;
  list-style: none;
}

.later-week + .later-week {
  border-top: 1px solid var(--color-border);
}

.later-week__title {
  padding: var(--space-3) var(--space-5);
  margin: 0;
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.eyebrow,
.schedule-group__label {
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

.tasks-link {
  display: inline-flex;
  flex: 0 0 auto;
  gap: var(--space-2);
  align-items: center;
  min-height: 2.75rem;
  padding: var(--space-3) var(--space-4);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: var(--radius-sm);
  font-weight: 700;
  text-decoration: none;
}

.tasks-link:hover {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.tasks-link svg {
  width: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.schedule-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin: var(--space-8) 0 0;
}

.schedule-summary div {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.schedule-summary dt {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 650;
}

.schedule-summary dd {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 750;
}

.schedule-groups {
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.schedule-group {
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px var(--color-shadow);
}

.schedule-group__heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.schedule-group__icon {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: var(--radius-sm);
  place-items: center;
}

.schedule-group__icon svg {
  width: 1.35rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.schedule-group__label {
  margin-bottom: var(--space-1);
  font-size: 0.6875rem;
}

.schedule-group h2 {
  margin: 0;
  font-size: 1.125rem;
}

.schedule-group__count {
  padding: var(--space-1) var(--space-3);
  color: var(--color-text-muted);
  background: var(--color-surface-soft);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.schedule-group--overdue .schedule-group__icon {
  color: #b42318;
  background: #fff0ef;
}

.schedule-group--today .schedule-group__icon {
  color: #166534;
  background: #ecfdf3;
}

:global(:root[data-theme='dark']) .schedule-group--overdue .schedule-group__icon {
  color: #ffaaa3;
  background: #4a2528;
}

:global(:root[data-theme='dark']) .schedule-group--today .schedule-group__icon {
  color: #92e6ad;
  background: #183b2a;
}

.schedule-group__empty {
  padding: var(--space-6) var(--space-5);
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
  text-align: center;
}

@media (max-width: 640px) {
  .upcoming-view__header {
    align-items: stretch;
    flex-direction: column;
  }

  .tasks-link {
    align-self: flex-start;
  }

  .schedule-summary {
    grid-template-columns: 1fr;
  }

  .schedule-group__heading {
    padding-inline: var(--space-4);
  }

  .schedule-group__empty {
    padding: var(--space-5) var(--space-4);
    text-align: left;
  }

  .later-week__title {
    padding-inline: var(--space-4);
  }
}
</style>
