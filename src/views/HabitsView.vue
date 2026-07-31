<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import AppButton from '@/shared/ui/AppButton.vue'
import AppDatePicker from '@/shared/ui/AppDatePicker.vue'
import AppDialog from '@/shared/ui/AppDialog.vue'
import AppField from '@/shared/ui/AppField.vue'
import { useHabitsStore } from '@/stores/habits'
import type { Habit, HabitSchedule } from '@/types/Habit'

const weekdays = [
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
  { value: 0, short: 'Sun', long: 'Sunday' },
]

const store = useHabitsStore()
const { habits, habitsForSelectedDate, selectedDate } = storeToRefs(store)
const dialogOpen = ref(false)
const editingId = ref<string>()
const errors = reactive({ name: '', weekdays: '' })
const form = reactive({
  name: '',
  scheduleType: 'daily' as 'daily' | 'weekdays',
  weekdays: [] as number[],
})

const selectedDateHeading = computed(() => dayjs(selectedDate.value).format('dddd, MMMM D'))
const selectedDayCompleteCount = computed(
  () =>
    habitsForSelectedDate.value.filter((habit) => store.isCompleted(habit, selectedDate.value))
      .length,
)

const resetForm = () => {
  editingId.value = undefined
  form.name = ''
  form.scheduleType = 'daily'
  form.weekdays = []
  errors.name = ''
  errors.weekdays = ''
}

const closeDialog = () => {
  dialogOpen.value = false
  resetForm()
}

const openCreate = () => {
  resetForm()
  dialogOpen.value = true
}

const openEdit = (habit: Habit) => {
  editingId.value = habit.id
  form.name = habit.name
  form.scheduleType = habit.schedule.type
  form.weekdays = habit.schedule.type === 'weekdays' ? [...habit.schedule.weekdays] : []
  errors.name = ''
  errors.weekdays = ''
  dialogOpen.value = true
}

const toggleWeekday = (weekday: number) => {
  const index = form.weekdays.indexOf(weekday)
  if (index >= 0) form.weekdays.splice(index, 1)
  else form.weekdays.push(weekday)
  errors.weekdays = ''
}

const submit = () => {
  errors.name = form.name.trim() ? '' : 'Habit name cannot be empty'
  errors.weekdays =
    form.scheduleType === 'weekdays' && form.weekdays.length === 0
      ? 'Choose at least one weekday'
      : ''
  if (errors.name || errors.weekdays) return

  const schedule: HabitSchedule =
    form.scheduleType === 'daily'
      ? { type: 'daily' }
      : { type: 'weekdays', weekdays: form.weekdays }
  const saved = editingId.value
    ? store.updateHabit(editingId.value, { name: form.name, schedule })
    : store.addHabit({ name: form.name, schedule })
  if (saved) {
    dialogOpen.value = false
    resetForm()
  }
}

const removeHabit = (habit: Habit) => {
  if (window.confirm(`Delete “${habit.name}” and its completion history?`)) {
    store.deleteHabit(habit.id)
  }
}

const scheduleLabel = (habit: Habit) =>
  habit.schedule.type === 'daily'
    ? 'Every day'
    : weekdays
        .filter(
          (weekday) =>
            habit.schedule.type === 'weekdays' && habit.schedule.weekdays.includes(weekday.value),
        )
        .map((weekday) => weekday.short)
        .join(', ')
</script>

<template>
  <section class="habits-view">
    <header class="page-header">
      <div>
        <p class="eyebrow">Daily rhythm</p>
        <h1>Habits</h1>
        <p class="description">Build consistency gently, one scheduled check-in at a time.</p>
      </div>
      <AppButton @click="openCreate">Add habit</AppButton>
    </header>

    <section v-if="!habits.length" class="empty-state" aria-labelledby="empty-state-title">
      <span class="empty-state__icon" aria-hidden="true">✓</span>
      <p class="eyebrow">A fresh start</p>
      <h2 id="empty-state-title">No habits yet</h2>
      <p>
        Add a small routine you would like to return to. You can choose every day or only the
        weekdays that suit you.
      </p>
      <AppButton @click="openCreate">Add your first habit</AppButton>
    </section>

    <section v-else class="day-card" aria-labelledby="day-title">
      <div class="day-card__header">
        <div>
          <p class="eyebrow">Checklist</p>
          <h2 id="day-title">{{ selectedDateHeading }}</h2>
          <p class="progress" aria-live="polite">
            {{ selectedDayCompleteCount }} of {{ habitsForSelectedDate.length }} completed
          </p>
        </div>
        <AppDatePicker v-model="selectedDate" label="Selected day" name="habitDate" required />
      </div>

      <ul v-if="habitsForSelectedDate.length" class="checklist">
        <li v-for="habit in habitsForSelectedDate" :key="habit.id">
          <label class="check-control">
            <input
              type="checkbox"
              :checked="store.isCompleted(habit, selectedDate)"
              @change="store.toggleHabitForDate(habit.id, selectedDate)"
            />
            <span>
              <strong>{{ habit.name }}</strong>
              <small>{{
                store.isCompleted(habit, selectedDate) ? 'Completed' : 'Ready to complete'
              }}</small>
            </span>
          </label>
        </li>
      </ul>
      <p v-else class="empty">No habits are scheduled for this day.</p>
    </section>

    <section v-if="habits.length" class="collection" aria-labelledby="all-habits-title">
      <div class="section-heading">
        <p class="eyebrow">Your routines</p>
        <h2 id="all-habits-title">All habits</h2>
      </div>
      <ul class="habit-grid">
        <li v-for="habit in habits" :key="habit.id" class="habit-card">
          <div class="habit-card__heading">
            <div>
              <h3>{{ habit.name }}</h3>
              <p>{{ scheduleLabel(habit) }}</p>
            </div>
            <div class="habit-card__actions">
              <button type="button" :aria-label="`Edit ${habit.name}`" @click="openEdit(habit)">
                Edit
              </button>
              <button
                class="danger"
                type="button"
                :aria-label="`Delete ${habit.name}`"
                @click="removeHabit(habit)"
              >
                Delete
              </button>
            </div>
          </div>

          <p class="streak">
            <span aria-hidden="true">✦</span>
            <strong>{{ store.currentStreak(habit) }}</strong>
            {{ store.currentStreak(habit) === 1 ? 'scheduled check-in' : 'scheduled check-ins' }} in
            your current streak
          </p>

          <ol class="history" :aria-label="`Recent history for ${habit.name}`">
            <li v-for="entry in store.recentHistory(habit)" :key="entry.date">
              <span class="history__mark" :class="{ complete: entry.completed }" aria-hidden="true">
                {{ entry.completed ? '✓' : '–' }}
              </span>
              <span>{{ dayjs(entry.date).format('ddd') }}</span>
              <span class="sr-only"
                >{{ dayjs(entry.date).format('MMMM D') }}:
                {{ entry.completed ? 'completed' : 'not completed' }}</span
              >
            </li>
          </ol>
        </li>
      </ul>
    </section>

    <AppDialog
      v-model:open="dialogOpen"
      :title="editingId ? 'Edit habit' : 'Add habit'"
      description="Choose when this habit belongs in your checklist."
      @dismiss="resetForm"
    >
      <form class="habit-form" aria-label="Habit details" @submit.prevent="submit">
        <AppField>
          <template #label>Habit name</template>
          <input
            v-model="form.name"
            name="habitName"
            autocomplete="off"
            :aria-invalid="errors.name ? 'true' : undefined"
            :aria-describedby="errors.name ? 'habit-name-error' : undefined"
          />
          <template #message>
            <span v-if="errors.name" id="habit-name-error" role="alert">{{ errors.name }}</span>
            <span v-else>Use a short, encouraging name.</span>
          </template>
        </AppField>

        <fieldset>
          <legend>Schedule</legend>
          <label><input v-model="form.scheduleType" type="radio" value="daily" /> Every day</label>
          <label
            ><input v-model="form.scheduleType" type="radio" value="weekdays" /> Selected
            weekdays</label
          >
        </fieldset>

        <fieldset
          v-if="form.scheduleType === 'weekdays'"
          :aria-describedby="errors.weekdays ? 'weekday-error' : undefined"
        >
          <legend>Weekdays</legend>
          <div class="weekday-picker">
            <button
              v-for="weekday in weekdays"
              :key="weekday.value"
              type="button"
              :aria-pressed="form.weekdays.includes(weekday.value)"
              :aria-label="weekday.long"
              @click="toggleWeekday(weekday.value)"
            >
              {{ weekday.short }}
            </button>
          </div>
          <p v-if="errors.weekdays" id="weekday-error" class="form-error" role="alert">
            {{ errors.weekdays }}
          </p>
        </fieldset>

        <div class="form-actions">
          <button type="button" @click="closeDialog">
            Cancel
          </button>
          <AppButton type="submit">{{ editingId ? 'Save changes' : 'Add habit' }}</AppButton>
        </div>
      </form>
    </AppDialog>
  </section>
</template>

<style scoped>
.habits-view {
  max-width: 62rem;
}
.page-header,
.day-card__header,
.habit-card__heading,
.form-actions {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  justify-content: space-between;
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
}
h2,
h3 {
  margin: 0;
}
.description,
.progress,
.habit-card__heading p,
.empty {
  color: var(--color-text-muted);
  line-height: 1.6;
}
.description {
  margin: var(--space-3) 0 0;
}
.day-card,
.habit-card,
.empty-state {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px var(--color-shadow);
}
.day-card {
  padding: var(--space-5);
  margin-top: var(--space-8);
}
.empty-state {
  display: grid;
  justify-items: center;
  max-width: 42rem;
  padding: var(--space-8) var(--space-5);
  margin: var(--space-8) auto 0;
  text-align: center;
}
.empty-state__icon {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  margin-bottom: var(--space-4);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 800;
  place-items: center;
}
.empty-state h2 {
  font-size: 1.5rem;
}
.empty-state > p:not(.eyebrow) {
  max-width: 32rem;
  margin: var(--space-3) 0 var(--space-5);
  color: var(--color-text-muted);
  line-height: 1.65;
}
.day-card__header :deep(.date-picker) {
  width: min(16rem, 100%);
}
.progress {
  margin: var(--space-2) 0 0;
}
.checklist,
.habit-grid {
  padding: 0;
  margin: var(--space-5) 0 0;
  list-style: none;
}
.checklist {
  display: grid;
  gap: var(--space-3);
}
.check-control {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  min-height: 3.5rem;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.check-control input {
  width: 1.35rem;
  height: 1.35rem;
  accent-color: var(--color-primary);
}
.check-control span {
  display: grid;
  gap: var(--space-1);
}
.check-control small {
  color: var(--color-text-muted);
}
.empty {
  margin: var(--space-5) 0 0;
}
.collection {
  margin-top: var(--space-8);
}
.habit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}
.habit-card {
  min-width: 0;
  padding: var(--space-5);
}
.habit-card__heading p {
  margin: var(--space-1) 0 0;
  font-size: 0.875rem;
}
.habit-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}
.habit-card__actions button,
.form-actions > button {
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-3);
  color: var(--color-primary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}
.habit-card__actions .danger {
  color: #b42318;
}
.streak {
  margin: var(--space-5) 0;
  padding: var(--space-3);
  background: var(--color-primary-soft);
  border-radius: var(--radius-sm);
  line-height: 1.5;
}
.streak span {
  color: var(--color-primary);
}
.history {
  display: flex;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
  list-style: none;
}
.history li {
  display: grid;
  gap: var(--space-1);
  justify-items: center;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
.history__mark {
  display: grid;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--color-control-border);
  border-radius: 50%;
  place-items: center;
  font-weight: 800;
}
.history__mark.complete {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.habit-form {
  display: grid;
  gap: var(--space-5);
}
.habit-form fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: 0;
  margin: 0;
  border: 0;
}
.habit-form legend {
  width: 100%;
  margin-bottom: var(--space-2);
  font-size: 0.875rem;
  font-weight: 700;
}
.habit-form label {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  min-height: 2.75rem;
}
.weekday-picker {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--space-1);
  width: 100%;
}
.weekday-picker button {
  min-width: 0;
  min-height: 2.75rem;
  padding: var(--space-1);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.weekday-picker button[aria-pressed='true'] {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  font-weight: 750;
}
.form-error {
  width: 100%;
  margin: 0;
  color: #b42318;
  font-size: 0.8125rem;
  font-weight: 650;
}
.form-actions {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}
.form-actions > button {
  color: var(--color-text);
  border-color: var(--color-control-border);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 700px) {
  .habit-grid {
    grid-template-columns: 1fr;
  }
  .page-header,
  .day-card__header {
    flex-direction: column;
  }
  .page-header :deep(.app-button),
  .day-card__header :deep(.date-picker) {
    width: 100%;
  }
}
@media (max-width: 420px) {
  .weekday-picker {
    grid-template-columns: repeat(4, 1fr);
  }
  .habit-card__heading {
    flex-direction: column;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto;
  }
}
</style>
